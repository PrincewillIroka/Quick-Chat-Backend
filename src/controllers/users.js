import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Chat from "../models/Chat";
import User from "../models/User";
import { handleToken } from "../utils";
import config from "../config";
import { uploader } from "../services/fileUploadServices";
import redis from "../redis";

const ObjectIdType = mongoose.Types.ObjectId;

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
          select: ["name", "photo", "isChatBot", "chatBotDetails"],
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
      //Add user as chat participant.

      if (!isParticipant && !passcode) {
        const newMessage = {
          content: `${user?.name} joined this chat.`,
          sender: user_id,
          createdAt: new Date(),
          _id: new ObjectIdType(),
          messageType: "info",
        };

        const chat = await Chat.findOneAndUpdate(
          {
            chat_url: chatUrlParam,
          },
          {
            $push: {
              participants: user_id,
              messages: newMessage,
            },
          },
          { new: true }
        )
          .populate([
            {
              path: "participants",
              select: ["name", "photo", "isChatBot", "chatBotDetails"],
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

        //Add this chat to already found chats
        chats = chats.map((ch) => (ch.chat_url === chatUrlParam ? chat : ch));

        // Broadcast to other participants that user has joined this chat
        const { _id: chat_id, participants = [] } = chat;
        const participantFound = participants.find(
          (participant) => participant._id.toString() === user_id
        );

        req.io.emit("participant-has-joined-chat", {
          participant: participantFound,
          chat_id,
          newMessage,
        });

        //Todo: Send redis notification to participants that are'nt online, informing them that a
        //a new user has joined the chat.
      }
    }

    res.send({ success: true, chats });
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
    const sizeOfFilesForUpload = file?.size;
    let photoUrl, photoUploadedSuccessfully;

    if (file && sizeOfFilesForUpload < 2000000) {
      const user = await User.findOne({ _id: user_id }).lean();
      const totalSizeOfFilesUploaded = user?.totalSizeOfFilesUploaded || 0;
      const grandTotal =
        Number(totalSizeOfFilesUploaded) + sizeOfFilesForUpload;
      const hasExceededFileUploadLimit =
        grandTotal > Number(config.upload.file_upload_limit);

      if (!hasExceededFileUploadLimit) {
        if (config.environment === "production") {
          const uploadResult = await uploader(
            file.tempFilePath,
            user_id,
            user_id //Pass user_id as public_id to prevent uploading profile photo duplicates
          );
          photoUrl = uploadResult.secure_url;
        } else {
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
        }
        photoUploadedSuccessfully = true;
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: user_id },
      {
        $set: {
          ...(name && { name, hasUpdatedUsername: true }),
          ...(photoUploadedSuccessfully && { photo: photoUrl }),
        },
        $inc: {
          ...(photoUploadedSuccessfully && {
            totalSizeOfFilesUploaded: sizeOfFilesForUpload,
          }),
        },
      },
      { new: true }
    ).lean();

    let {
      bs_token,
      totalGPTMessagesReceived,
      totalSizeOfFilesUploaded,
      createdAt,
      updatedAt,
      ...rest
    } = updatedUser;

    // When a user updates their name/photo, other participants should be notified.
    req.io.emit("participant-profile-updated", { updatedParticipant: rest });

    res.send({ success: true, updatedUser: rest });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

const setUpChatBot = async () => {
  try {
    const chatBot = await User.findOne({ isChatBot: true });
    if (!chatBot) {
      const photo = config.chat_bot.photo;

      const uidv4 = uuidv4();
      const bs_token = `${uidv4}_${Date.now()}`;

      await User.create({
        name: "QuickChat Bot",
        photo,
        bs_token,
        isChatBot: true,
        hasUpdatedUsername: true,
        chatBotDetails: {
          isSystemBot: true,
          isUserBot: false,
          botPrompt:
            "Your name is QuickChatBot and you are a helpful assistant that can chat with multiple users.",
        },
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
    ).lean();

    const { isDarkMode: updatedDarkMode } = updatedUser;

    res.send({ success: true, updatedDarkMode });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

const getNotifications = async (req, res) => {
  try {
    const { bs_token = "" } = req.body;

    const user = await User.findOne({ bs_token });
    const user_id = user?._id.toString();

    // await redis.getClient().del(`notification-${user_id}`);
    let notifications = await redis.getClient().get(`notification-${user_id}`);
    notifications = JSON.parse(notifications) || [];

    res.send({ success: true, notifications });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

export {
  getChats,
  authenticateUser,
  updateUser,
  setUpChatBot,
  updateDarkMode,
  getNotifications,
};
