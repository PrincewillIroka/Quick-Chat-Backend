import mongoose from "mongoose";
import Chat from "../models/Chat";
// import { getTokenFromCookie } from "../utils";
const ObjectIdType = mongoose.Types.ObjectId;

const chatSocket = (socket) => {
  socket.on("join", (arg) => {
    // const bs_token = getTokenFromCookie(socket.handshake.headers);
    const { chat_url } = arg;
    socket.join(chat_url);
  });

  socket.on("newMessageSent", async (arg, ack) => {
    const { chat_url, chat_id, content, sender_id } = arg;
    const messageId = new ObjectIdType();

    const newMessage = {
      content,
      sender: sender_id,
      createdAt: new Date(),
      _id: messageId,
    };

    let updatedChat = await Chat.findByIdAndUpdate(
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
          select: ["name", "photo"],
        },
        {
          path: "messages.sender",
          select: ["name", "photo"],
        },
        {
          path: "messages.attachments",
        },
      ])
      .then((chat) => (chat ? chat.toJSON() : chat))
      .catch((err) => console.error(err));

    ack({ messageSent: true, updatedChat, messageId });
    socket.broadcast.to(chat_url).emit("newMessageReceived", { updatedChat });
  });
};

export default chatSocket;
