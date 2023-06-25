import mongoose from "mongoose";
const ObjectId = mongoose.Schema.Types.ObjectId;

const FileShema = new mongoose.Schema(
  {
    file_details: Object,
    sender: { type: ObjectId, ref: "User" },
    chat_id: { type: ObjectId, ref: "Chat" },
  },
  { usePushEach: true, timestamps: true }
);

const File = mongoose.model("File", FileShema);

export default File;
