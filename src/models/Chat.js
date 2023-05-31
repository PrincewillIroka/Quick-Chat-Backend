import mongoose from "mongoose";
const ObjectId = mongoose.Schema.Types.ObjectId;

const ChatShema = new mongoose.Schema(
  {
    creator_id: ObjectId,
    chat_url: String,
    participants: [{ type: ObjectId, ref: "User" }],
    messages: {
      type: [Object],
      default: [],
    },
  },
  { usePushEach: true, timestamps: true }
);

const Chat = mongoose.model("Chat", ChatShema);

export default Chat;
