import Chat from "../models/Chat";
import User from "../models/User";
import { handleToken, getTokenFromCookie } from "../utils";
import config from "../config";

const getChats = async (req, res) => {
  try {
    const { chatUrlParam = "" } = req.query;
    const bs_token = getTokenFromCookie(req.headers);

    const user = await User.findOne({ bs_token });
    const user_id = user?._id;
    let chats = await Chat.find({
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
      .lean()
      .exec()
      .then((chatsFound) => chatsFound);

    if (chatUrlParam) {
      const isChatFound = chats.find((chat) => chat.chat_url === chatUrlParam);

      if (!isChatFound) {
        const foundChat = await Chat.findOne({
          chat_url: chatUrlParam,
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
          .then((chatFound) => chatFound);
        chats = [...chats, foundChat];
      }
    }

    res.send({ chats });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

const authenticateUser = async (req, res) => {
  try {
    const bs_token = await handleToken(req.headers);

    const user = await User.findOne({ bs_token });

    const { environment = "", frontendAppUrl = "" } = config;

    res
      .cookie("bs_token", bs_token, {
        path: "/",
        domain: environment === "production" ? frontendAppUrl : "localhost",
        sameSite: "lax",
        httpOnly: false,
        secure: false,
        maxAge: 34560000000,
      })
      .status(200)
      .json({ user });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

const getUser = async () => {};

export { getChats, authenticateUser };
