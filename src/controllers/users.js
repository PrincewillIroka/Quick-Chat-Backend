import Chat from "../models/Chat";
import User from "../models/User";
import { handleToken, getTokenFromCookie } from "../utils";

const getChats = async (req, res) => {
  try {
    const bs_token = getTokenFromCookie(req.headers);

    const user = await User.findOne({ bs_token });
    const user_id = user?._id;

    const chats = await Chat.find({
      $or: [{ creator_id: user_id }, { participants: { $in: [user_id] } }],
    })
      .populate([
        {
          path: "participants",
          select: ["name", "photo"],
        },
        {
          path: "messages.sender",
          select: ["name", "photo"],
        },
      ])
      .exec()
      .then((chatsFound) => chatsFound);

    res.send({ chats });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

const authenticateUser = async (req, res) => {
  try {
    const bs_token = handleToken(req.headers);
    res
      .cookie("bs_token", bs_token, {
        path: "/",
        sameSite: "lax",
        httpOnly: false,
        secure: false,
        maxAge: 34560000000,
      })
      .status(200)
      .json({ value: true });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};
export { getChats, authenticateUser };
