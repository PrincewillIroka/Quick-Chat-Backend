import mongoose from "mongoose";

const UserShema = new mongoose.Schema(
  {
    name: String,
    photo: String,
    bs_token: String,
    hasUpdatedUsername: { type: Boolean, default: false },
  },
  { usePushEach: true, timestamps: true }
);

const User = mongoose.model("User", UserShema);

export default User;
