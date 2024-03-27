import { type } from "@hapi/joi/lib/extend";
import mongoose from "mongoose";

const UserShema = new mongoose.Schema(
  {
    name: String,
    photo: String,
    bs_token: String,
    hasUpdatedUsername: { type: Boolean, default: false },
    isChatBot: { type: Boolean, default: false },
    isDarkMode: { type: Boolean, default: false },
    totalGPTMessagesReceived: { type: Number, default: 0 },
    totalSizeOfFilesUploaded: { type: Number, default: 0 },
  },
  { usePushEach: true, timestamps: true }
);

const User = mongoose.model("User", UserShema);

export default User;
