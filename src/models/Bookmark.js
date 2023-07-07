import mongoose from "mongoose";
const ObjectId = mongoose.Schema.Types.ObjectId;

const BookmarkShema = new mongoose.Schema(
  {
    creator_id: ObjectId,
    chat_id: { type: ObjectId, ref: "Chat" },
  },
  { usePushEach: true, timestamps: true }
);

const Bookmark = mongoose.model("Bookmark", BookmarkShema);

export default Bookmark;
