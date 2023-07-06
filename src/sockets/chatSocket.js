import mongoose from "mongoose";
import Chat from "../models/Chat";
// import { getTokenFromCookie } from "../utils";
const ObjectIdType = mongoose.Types.ObjectId;

const chatSocket = (io, socket) => {
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

    //To do 1: Broadcast this socket event to updatedChat.participants instead of broadcasting it to only
    // those in the chat_url channel/group
    socket.broadcast.to(chat_url).emit("newMessageReceived", {
      chat_id,
      message_id,
      newMessage: newMessageForReceiver,
    });
  });
};

export default chatSocket;
