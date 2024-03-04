import mongoose from "mongoose";
import Chat from "../models/Chat";
import { getTokenFromCookie, decryptData } from "../utils";
import redis from "../redis";

const ObjectIdType = mongoose.Types.ObjectId;

const chatSocket = (io, socket) => {
  socket.on("join", async ({ user_id }) => {
    // const bs_token = getTokenFromCookie(socket.handshake.headers);
    socket.join(user_id);
    global.users[socket.id] = user_id;

    console.debug("User joined successfully!", {
      socketId: socket.id,
      user_id,
    });
  });

  socket.on("disconnect", () => {
    const user_id = global.users[socket.id];
    console.debug("User disconnected!", { socketId: socket.id, user_id });
    delete global.users[socket.id];
    delete global.selectedChat[user_id];
  });

  socket.on("new-message-sent", async (arg, ack) => {
    try {
      const { chat_url, chat_id, content, sender_id } = arg;

      const decryptedContent = decryptData(content);

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

      newMessage.sender = { _id: sender_id };
      ack({ messageSent: true, chat_id, message_id, newMessage });

      const chatMessages = updatedChat.messages;
      const newMessageForReceiver = chatMessages.find(
        (msg) => msg._id == message_id.toString()
      );

      // Broadcast socket event to updatedChat.participants
      const { participants = [] } = updatedChat;
      const messageSender = participants.find(
        (participant) => participant._id.toString() === sender_id
      );

      for (let participant of participants) {
        const { _id = "" } = participant;
        const participantId = _id.toString();

        if (participantId !== sender_id) {
          socket.broadcast.to(participantId).emit("new-message-received", {
            chat_id,
            message_id,
            newMessage: newMessageForReceiver,
            participantId,
          });

          const userSelectedChat = global.selectedChat[participantId];
          const isCurrentSelectedChat = userSelectedChat === chat_url;

          const senderName = messageSender?.name;
          const value = `${senderName} sent a new message.`;

          if (!userSelectedChat) {
            // If user is not online(doesn't have a selected chat),
            // Save notification to redis.

            Promise.resolve(async () => {
              let notifications = await redis
                .getClient()
                .get(`notification-${participantId}`);

              notifications = JSON.parse(notifications) || [];
              notifications = notifications.concat(notifications, [
                {
                  message_id,
                  value,
                  chat_id,
                  chat_url,
                },
              ]);

              await redis
                .getClient()
                .set(
                  `notification-${participantId}`,
                  JSON.stringify(notifications)
                );
            });
          }

          if (userSelectedChat && !isCurrentSelectedChat) {
            // If this chat isn't the user's current selected chat,
            // Emit an event to the user, informing them that a new message was sent to the chat.

            socket.broadcast
              .to(participantId)
              .emit("new-message-notification", {
                chat_id,
                value,
              });
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("participant-join-selected-chat", async ({ user_id, chat_url }) => {
    socket.join(chat_url);
    global.selectedChat[user_id] = chat_url;
  });

  socket.on("participant-is-typing", ({ chat_url, message }) => {
    socket.broadcast.to(chat_url).emit("update-participant-typing", message);
  });
};

export default chatSocket;
