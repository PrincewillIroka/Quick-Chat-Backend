import mongoose from "mongoose";

const ChatShema = new mongoose.Schema(
  {
    creator_id: String,
    chat_url: String,
    participants: {
      type: [String],
      default: [],
    },
    messages: {
      type: [Object],
      default: [],
    },
  },
  { usePushEach: true, timestamps: true }
);

const Chat = mongoose.model("Chat", ChatShema);

export default Chat;
