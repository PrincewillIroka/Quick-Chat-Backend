import mongoose from "mongoose";
import Chat from "../models/Chat";
// import { getTokenFromCookie } from "../utils";
import redis from "../redis";
const ObjectIdType = mongoose.Types.ObjectId;

const chatSocket = (io, socket) => {
  socket.on("join", (arg) => {
    // const bs_token = getTokenFromCookie(socket.handshake.headers);
    const { user_id } = arg;
    socket.join(user_id);
    // const str = io.fetchSockets().then((room) => {
    //   console.log("clients in this room: ", room);
    // });
    // console.log({ str });
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

    // Broadcast socket event to updatedChat.participants
    const { participants = [] } = updatedChat;
    for (let participant of participants) {
      const { _id = "" } = participant;
      const participantId = _id.toString();

      socket.broadcast.to(participantId).emit("newMessageReceived", {
        chat_id,
        message_id,
        newMessage: newMessageForReceiver,
      });
    }
  });

  socket.on("toggledSelectedChat", ({ user_id, chat_url }) => {
    const redisClient = redis.getClient();
    // redisClient.set();
  });
};

export default chatSocket;
