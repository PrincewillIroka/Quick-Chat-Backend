import mongoose from "mongoose";

const UserShema = new mongoose.Schema(
  {
    name: String,
    photo: String,
    bs_token: String,
  },
  { usePushEach: true, timestamps: true }
);

const User = mongoose.model("User", UserShema);

export default User;
