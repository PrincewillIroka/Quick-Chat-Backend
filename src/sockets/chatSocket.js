import mongoose from "mongoose";
import Chat from "../models/Chat";
import User from "../models/User";
import { getTokenFromCookie, decryptData } from "../utils";
import redis from "../redis";
import { GPT_PARAMETERS } from "../constants";
import config from "../config";
import { openai } from "../services";

const ObjectIdType = mongoose.Types.ObjectId;

const chatSocket = (io, socket) => {
  socket.on("new-message-sent", async (arg, ack) => {
    try {
      const { chat_url, chat_id, content, sender_id } = arg;

      let decryptedContent = decryptData(content);

      const message_id = new ObjectIdType();

      const newMessage = {
        content: decryptedContent,
        sender: sender_id,
        createdAt: new Date(),
        _id: message_id,
      };

      const updatedChat = await Chat.findByIdAndUpdate(
        chat_id,
        {
          $push: {
            messages: newMessage,
          },
        },
        { new: true }
      )
        .populate([
          {
            path: "participants",
            select: ["name", "photo", "isChatBot", "totalGPTMessagesReceived"],
          },
          {
            path: "messages.sender",
            select: ["name", "photo", "isChatBot"],
          },
          {
            path: "messages.attachments",
          },
        ])
        .lean();

      newMessage.sender = { _id: sender_id };
      ack({ messageSent: true, chat_id, message_id, newMessage });

      const { participants = [], messages: chatMessages = [] } = updatedChat;

      //Broadcast socket event to updatedChat.participants
      const newMessageForReceiver = chatMessages.find(
        (msg) => msg._id == message_id.toString()
      );
      socket.broadcast.to(chat_url).emit("new-message-received", {
        chat_id,
        message_id,
        newMessage: newMessageForReceiver,
      });

      //Handle send message to GPT if chatbot is a participant in this chat.
      const chatBot = participants.find(({ isChatBot }) => isChatBot === true);
      if (chatBot) {
        //Check if sender has exceeded totalGPTMessagesReceived.
        const sender = participants.find(
          ({ _id }) => _id.toString() === sender_id
        );
        const { totalGPTMessagesReceived } = sender || {};
        const canSendMessageToGPT =
          Number(totalGPTMessagesReceived) <
          Number(config.gpt.gpt_messages_limit);

        if (canSendMessageToGPT) {
          io.to(chat_url).emit("update-participant-typing", {
            chat_url,
            message: "QuickChat Bot is typing...",
          });

          const messages = GPT_PARAMETERS.map((message) => {
            if (message.role === "user") {
              message.content = decryptedContent;
            }

            return message;
          });

          await openai.chat.completions
            .create({
              messages,
              model: config.gpt.gpt_model,
            })
            .then(async (response) => {
              const actualResponse = response?.choices[0]?.message?.content;

              if (actualResponse) {
                const message_id = new ObjectIdType();
                let { _id: chatBotId = "" } = chatBot || {};
                chatBotId = chatBotId.toString();

                // console.debug({ api_response: actualResponse });

                const updatedChat = await Chat.findByIdAndUpdate(
                  chat_id,
                  {
                    $push: {
                      messages: {
                        content: actualResponse,
                        sender: chatBotId,
                        createdAt: new Date(),
                        _id: message_id,
                      },
                    },
                  },
                  { new: true }
                )
                  .populate([
                    {
                      path: "participants",
                      select: ["name", "photo", "isChatBot"],
                    },
                    {
                      path: "messages.sender",
                      select: ["name", "photo", "isChatBot"],
                    },
                    {
                      path: "messages.attachments",
                    },
                  ])
                  .lean();

                const { messages: chatMessages = [] } = updatedChat;

                const newMessageForReceiver = chatMessages.find(
                  (msg) => msg._id == message_id.toString()
                );
                io.to(chat_url).emit("new-message-received", {
                  chat_id,
                  message_id,
                  newMessage: newMessageForReceiver,
                  chat_url,
                });

                //Update totalGPTMessagesReceived for this sender
                await User.findOneAndUpdate(
                  { _id: sender_id },
                  { $inc: { totalGPTMessagesReceived: 1 } },
                  { new: true }
                );
              }
            })
            .catch((error) => {
              io.to(chat_url).emit("update-participant-typing", {
                chat_url,
                message: "",
              });
              console.error(error);
            });
        } else {
          // Todo: Send response to user that they've exceeded totalGPTMessagesReceived
        }
      }

      //Handle notification (realtime & redis) to updatedChat.participants
      const messageSender = participants.find(
        (participant) => participant._id.toString() === sender_id
      );
      participants.forEach(({ _id: participantId, isChatBot = false }) => {
        participantId = participantId.toString();

        if (participantId !== sender_id && !isChatBot) {
          const userSelectedChat = global.selectedChat[participantId];
          const isCurrentSelectedChat = userSelectedChat === chat_url;

          const senderName = messageSender?.name;
          const value = `${senderName} sent a new message.`;

          if (!userSelectedChat) {
            // If user is not online(doesn't have a selected chat),
            // Save notification to redis.

            new Promise(async (resolve) => {
              let notifications = await redis
                .getClient()
                .get(`notification-${participantId}`);

              notifications = notifications ? JSON.parse(notifications) : [];
              notifications = notifications.concat(notifications, [
                {
                  message_id,
                  value,
                  chat_id,
                  chat_url,
                },
              ]);

              if (notifications.length) {
                const updatedNotifications = await redis
                  .getClient()
                  .set(
                    `notification-${participantId}`,
                    JSON.stringify(notifications)
                  );
                resolve(updatedNotifications);
              }
            });
          }

          if (userSelectedChat && !isCurrentSelectedChat) {
            // If this chat isn't the user's current selected chat and the user is online,
            // Emit an event to the user, informing them that a new message was sent to the chat.

            socket.broadcast
              .to(participantId)
              .emit("new-message-notification", {
                chat_id,
                value,
              });
          }
        }
      });
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("participant-join-selected-chat", ({ user_id, chat_url }) => {
    socket.join(chat_url);
    global.selectedChat[user_id] = chat_url;
  });

  socket.on("participant-is-typing", ({ chat_url, message }) => {
    socket.broadcast
      .to(chat_url)
      .emit("update-participant-typing", { chat_url, message });
  });

  socket.on("rename-chat", async (args, ack) => {
    let { chat_id, chat_name } = args;

    const chat = await Chat.findById(chat_id).lean();

    if (!chat) {
      ack({ success: false, message: "Chat not found!" });
      return;
    }

    const updatedChat = await Chat.findOneAndUpdate(
      { _id: chat_id },
      {
        ...(chat_name && { chat_name }),
      },
      { new: true }
    ).lean();

    chat_name = updatedChat.chat_name;

    // When a user updates the chat_name, other participants should be notified.
    socket.broadcast.emit("chat-renamed", { chat_name, chat_id });

    //Todo: Save notification that chat was renamed to Redis

    ack({ success: true, chat_name });
  });

  socket.on("delete-chat", async (args, ack) => {
    let { chat_id } = args;

    const chat = await Chat.findById(chat_id).lean();

    if (!chat) {
      ack({ success: false, message: "Chat not found!" });
      return;
    }

    await Chat.findOneAndDelete({ _id: chat_id });

    //When a user deletes the chat, other participants should be notified.
    socket.broadcast.emit("chat-deleted", { chat_id });

    //Todo: Save notification that "chat was deleted" to Redis

    ack({ success: true, chat_id });
  });

  socket.on("remove-participant", async (args, ack) => {
    let { sender_id, chat_id, participant_id } = args;

    const chat = await Chat.findById(chat_id).lean();

    if (!chat) {
      ack({ success: false, message: "Chat not found!" });
      return;
    }

    const user = await User.findOne({ _id: participant_id }).lean();

    const newMessage = {
      content: `${user?.name} was removed from this chat.`,
      sender: sender_id,
      createdAt: new Date(),
      _id: new ObjectIdType(),
      messageType: "info",
    };

    await Chat.findOneAndUpdate(
      { _id: chat_id },
      {
        $push: {
          messages: newMessage,
        },
        $pull: {
          participants: participant_id,
          access_rights: participant_id,
        },
      },
      { new: true }
    );

    //When a user deletes the chat, other participants should be notified.
    socket.broadcast.emit("participant-removed", {
      chat_id,
      participant_id,
      newMessage,
    });

    //Todo: Save notification that "chat was deleted" to Redis

    ack({ success: true, chat_id, participant_id, newMessage });
  });
};

export default chatSocket;
