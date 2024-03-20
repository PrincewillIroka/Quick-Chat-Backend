import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import Chat from "../models/Chat";
import User from "../models/User";
import { handleToken } from "../utils";
import config from "../config";
import { uploader } from "../services";
import redis from "../redis";

const getChats = async (req, res) => {
  try {
    const { bs_token = "", chatUrlParam = "" } = req.body;
    // const bs_token = getTokenFromCookie(req.headers);

    // Get user
    const user = await User.findOne({ bs_token });
    const user_id = user?._id.toString();

    // Get user's chats & current chat with this chatUrlParam too
    let chats = await Chat.find({
      $or: [
        { creator_id: user_id },
        { participants: { $in: [user_id] } },
        { chat_url: chatUrlParam },
      ],
    })
      .populate([
        {
          path: "participants",
          select: ["name", "photo", "isChatBot"],
        },
        {
          path: "messages.sender",
          select: ["name", "photo", "isChatBot"],
        },
        {
          path: "messages.attachments",
        },
      ])
      .sort([["updatedAt", -1]])
      .lean();

    const chatFound = chats.find((chat) => chat.chat_url === chatUrlParam);

    if (chatFound) {
      const { passcode = "", participants = [] } = chatFound || {};
      const isParticipant = participants.find(
        (participant) => participant?._id.toString() === user_id
      );

      //If user isn't a participant && if this chat doesn't have a passcode.
      if (!isParticipant && !passcode) {
        //Add user as chat participant.
        const chat = await Chat.findOneAndUpdate(
          {
            chat_url: chatUrlParam,
          },
          {
            $push: {
              participants: user_id,
            },
          },
          { new: true }
        )
          .populate([
            {
              path: "participants",
              select: ["name", "photo", "isChatBot"],
            },
            {
              path: "messages.sender",
              select: ["name", "photo", "isChatBot"],
            },
            {
              path: "messages.attachments",
            },
          ])
          .lean();

        chats = chats.map((ch) => (ch.chat_url === chatUrlParam ? chat : ch));

        // Broadcast to other participants that user has join this chat
        const { _id: chat_id, participants = [] } = chat;
        const participantFound = participants.find(
          (participant) => participant._id.toString() === user_id
        );

        req.io.to(chatUrlParam).emit("participant-has-joined-chat", {
          participant: participantFound,
          chat_id,
        });

        //To do: Send notification to participants, informing them that a
        //a new user has joined the chat.
      }
    }

    // await redis.getClient().del(`notification-${user_id}`);
    let notifications = await redis.getClient().get(`notification-${user_id}`);
    notifications = JSON.parse(notifications) || [];

    res.send({ success: true, chats, notifications });
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
      if (config.environment !== "production") {
        // Local file upload
        const folder_path = `assets/${user_id}`;

        const staticFolder = path.join(process.cwd(), folder_path);
        if (!fs.existsSync(staticFolder)) {
          fs.mkdirSync(staticFolder, { recursive: true });
        }

        const file_name = new Date().valueOf();
        const file_path = `${folder_path}/${file_name}`;
        photoUrl = `${config.serverAddress}/api/assets/${user_id}/${file_name}`;

        const { data } = file;

        await fs.writeFile(file_path, data, (err, rs) => {
          if (err) throw err;
          return rs;
        });
      } else {
        const uploadResult = await uploader(
          file.tempFilePath,
          user_id,
          user_id //Pass user_id as public_id to prevent uploading profile photo duplicates
        );
        photoUrl = uploadResult.secure_url;
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: user_id },
      {
        ...(name && { name, hasUpdatedUsername: true }),
        ...(photoUrl && { photo: photoUrl }),
      },
      { new: true }
    );

    res.send({ user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

const setUpChatBot = async () => {
  try {
    const chatBot = await User.findOne({ isChatBot: true });
    if (!chatBot) {
      let photo;
      if (config.environment !== "production") {
        photo = `${config.serverAddress}/api/assets/quickchat-bot-photo.png`;
      } else {
        photo =
          "https://res.cloudinary.com/dhz0mnlc2/image/upload/v1688341854/assets/mytxrieabnapp4csyghj.avif";
      }

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
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

const updateDarkMode = async (req, res) => {
  try {
    const { user_id, isDarkMode } = req.body;

    const updatedUser = await User.findOneAndUpdate(
      { _id: user_id },
      {
        isDarkMode,
      },
      { new: true }
    );
    const updatedDarkMode = updatedUser.isDarkMode;

    res.send({ success: true, updatedDarkMode });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

export { getChats, authenticateUser, updateUser, setUpChatBot, updateDarkMode };
