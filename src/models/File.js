import mongoose from "mongoose";
const ObjectId = mongoose.Schema.Types.ObjectId;

const FileShema = new mongoose.Schema(
  {
    attachment: {
      isUploading: {
        type: String,
        default: "In Progress",
      },
      name: String,
      mimetype: String,
      size: Number,
      file_url: String,
      key: String,
    },
    sender: { type: ObjectId, ref: "User" },
    chat_id: { type: ObjectId, ref: "Chat" },
    message_id: { type: ObjectId },
  },
  { usePushEach: true, timestamps: true }
);

const File = mongoose.model("File", FileShema);

export default File;
