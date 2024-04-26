import mongoose from "mongoose";
const ObjectId = mongoose.Schema.Types.ObjectId;

const UserShema = new mongoose.Schema(
  {
    name: { type: String, unique: true },
    photo: String,
    bs_token: String,
    hasUpdatedUsername: { type: Boolean, default: false },
    isChatBot: { type: Boolean, default: false },
    isDarkMode: { type: Boolean, default: false },
    totalGPTMessagesReceived: { type: Number, default: 0 },
    totalSizeOfFilesUploaded: { type: Number, default: 0 },
    chatBotDetails: {
      isSystemBot: { type: Boolean, default: false },
      isUserBot: { type: Boolean, default: false },
      botPrompt: { type: String },
      botOwner: {
        type: ObjectId,
        ref: "User",
      },
    },
  },
  { usePushEach: true, timestamps: true }
);

const User = mongoose.model("User", UserShema);

export default User;
