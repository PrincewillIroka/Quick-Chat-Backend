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
    const message_id = new ObjectIdType();

    const newMessage = {
      content,
      sender: sender_id,
      createdAt: new Date(),
      _id: message_id,
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

    ack({ messageSent: true, updatedChat, message_id });

    //To do 1: Broadcast this socket event to updatedChat.participants instead of broadcasting it to only
    // those in the chat_url channel/group
    socket.broadcast.to(chat_url).emit("newMessageReceived", { updatedChat });

    //To do 2: Change this updatedChat result to send only the content of the updated message
  });
};

export default chatSocket;
