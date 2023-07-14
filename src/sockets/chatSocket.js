import mongoose from "mongoose";
import Chat from "../models/Chat";
import { getTokenFromCookie, decryptData } from "../utils";
import redis from "../redis";

const ObjectIdType = mongoose.Types.ObjectId;

const chatSocket = (io, socket) => {
  socket.on("join", ({ user_id }) => {
    // const bs_token = getTokenFromCookie(socket.handshake.headers);
    socket.join(user_id);
    global.users[user_id] = user_id;
  });

  socket.on("disconnect", ({ user_id }) => {
    console.log("user " + global.users[user_id] + " disconnected");
    delete global.users[user_id];
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
      for (let participant of participants) {
        const { _id = "" } = participant;
        const participantId = _id.toString();

        socket.broadcast.to(participantId).emit("new-message-received", {
          chat_id,
          message_id,
          newMessage: newMessageForReceiver,
        });
      }
    } catch (err) {
      console.error(err);
    }
  });

  socket.on("participant-join-selected-chat", ({ user_id, chat_url }) => {
    socket.join(chat_url);
  });

  socket.on("participant-is-typing", ({chat_url, message }) => {
    socket.broadcast.to(chat_url).emit("update-participant-typing", message);
  });
};

export default chatSocket;
