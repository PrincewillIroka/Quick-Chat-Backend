import { v4 as uuidv4 } from "uuid";
import Chat from "../models/Chat";
import User from "../models/User";
import { handleToken } from "../utils";
import config from "../config";
import { uploader } from "../services";

const getChats = async (req, res) => {
  try {
    const { bs_token = "", chatUrlParam = "" } = req.body;
    // const bs_token = getTokenFromCookie(req.headers);

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
        {
          path: "messages.attachments",
        },
      ])
      .sort([["updatedAt", -1]])
      .lean()
      .exec()
      .then((chatsFound) => chatsFound);

    const chatExists = await Chat.exists({ chat_url: chatUrlParam });

    if (chatExists) {
      const isChatFound = chats.find((chat) => chat.chat_url === chatUrlParam);

      if (!isChatFound) {
        //Add user as chat participant
        const foundChat = await Chat.findOneAndUpdate(
          {
            chat_url: chatUrlParam,
          },
          {
            $push: {
              participants: user_id,
            },
          }
        )
          .populate([
            {
              path: "participants",
              select: ["name", "photo"],
            },
            {
              path: "messages.sender",
              select: ["name", "photo"],
            },
            {
              path: "messages.attachments",
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
    // const bs_token = await handleToken(req.headers);
    let { bs_token } = req.body;

    if (!bs_token) {
      bs_token = await handleToken();
    }

    const user = await User.findOne({ bs_token });

    // const { environment = "", frontendAppUrl = "" } = config;

    // res
    //   .cookie("bs_token", bs_token, {
    //     path: "/",
    //     domain: environment === "production" ? frontendAppUrl : "localhost",
    //     sameSite: "none",
    //     httpOnly: false,
    //     secure: true,
    //     maxAge: 34560000000,
    //   })
    //   .status(200)
    //   .json({ user });

    res.send({ user });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

const updateUser = async (req, res) => {
  try {
    const { username: name, user_id } = req.body;
    const files = req.files || [];
    const file = Object.values(files)[0];
    let photoUrl;

    if (file) {
      const uploadResult = await uploader(file.tempFilePath, user_id);
      photoUrl = uploadResult.url;
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: user_id },
      { ...(name && { name }), ...(photoUrl && { photo: photoUrl }) },
      { new: true }
    );

    res.send({ user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

const setUpChatBot = async () => {
  const chatBot = await User.findOne({ isChatBot: true });
  if (!chatBot) {
    const photo = `${config.serverAddress}/api/assets/quickchat-bot-photo.jpeg`;
    const uidv4 = uuidv4();
    const bs_token = `${uidv4}_${Date.now()}`;

    await User.create({
      name: "QuickChat Bot",
      photo,
      bs_token,
      isChatBot: true,
      hasUpdatedUsername: true,
    });
  }
};

export { getChats, authenticateUser, updateUser, setUpChatBot };
