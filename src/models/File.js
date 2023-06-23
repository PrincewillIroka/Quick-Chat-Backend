import mongoose from "mongoose";
const ObjectId = mongoose.Schema.Types.ObjectId;

const FileShema = new mongoose.Schema(
  {
    file_details: Object,
    sender: { type: ObjectId, ref: "User" },
    chat_id: String,
  },
  { usePushEach: true, timestamps: true }
);

const File = mongoose.model("File", FileShema);

export default File;
