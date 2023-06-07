import mongoose from "mongoose";
const ObjectId = mongoose.Schema.Types.ObjectId;
const ObjectIdType = mongoose.Types.ObjectId;

const ChatShema = new mongoose.Schema(
  {
    creator_id: ObjectId,
    chat_url: String,
    participants: [{ type: ObjectId, ref: "User" }],
    messages: [
      {
        _id: {
          type: ObjectId,
        },
        content: String,
        sender: { type: ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { usePushEach: true, timestamps: true }
);

const Chat = mongoose.model("Chat", ChatShema);

export default Chat;