import mongoose from "mongoose";
import cookie from "cookie";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";
import User from "../models/User";
import Chat from "../models/Chat";
import File from "../models/File";
import config from "../config";
import { CHAT_BOT_SETUP_MESSAGES } from "../constants";

const ObjectIdType = mongoose.Types.ObjectId;

const generateChatUrl = () => {
  return Array(45)
    .fill(0)
    .map(() => Math.random().toString(36).charAt(2))
    .join("");
};

const getTokenFromCookie = (headers) => {
  const { cookie: cookieHeaders } = headers;

  const { bs_token } = cookieHeaders ? cookie.parse(cookieHeaders) : {};

  return bs_token;
};

const handleToken = async () => {
  try {
    // let bs_token = getTokenFromCookie(headers);

    // valdateToken()

    let bs_token;

    if (!bs_token) {
      const uidv4 = uuidv4();
      bs_token = `${uidv4}_${Date.now()}`;

      // Create new user here
      const usersThatHaveNotUpdatedUsername = await User.countDocuments({
        hasUpdatedUsername: false,
      });
      const userNameIndex = usersThatHaveNotUpdatedUsername + 1;
      const user = await User.create({
        bs_token,
        name: `User ${userNameIndex}`,
      });

      const chatBot = await User.findOne({ isChatBot: true });

      const creator_id = user._id;
      const chatBotId = chatBot._id;
      const participants = [chatBotId, creator_id];
      const chat_url = generateChatUrl();

      let lastMsgId;

      const chatBotMessages = CHAT_BOT_SETUP_MESSAGES.reduce(
        (acc, cur, curIndex) => {
          const message_id = new ObjectIdType();
          if (curIndex === 3) {
            lastMsgId = message_id;
          }
          cur = {
            content: cur,
            sender: chatBotId,
            createdAt: new Date(),
            _id: message_id,
          };
          acc = acc.concat([cur]);
          return acc;
        },
        []
      );

      // Create default chat for new user & message from QuickChat bot
      const newChat = await Chat.create({
        creator_id,
        chat_url,
        participants,
        messages: chatBotMessages,
      });

      // Add chatBot attachments/files for new user
      const chat_id = newChat._id;
      const chatBotAttachments = [
        {
          attachment: {
            name: "Quick_Chat_App_Demo.mp4",
            file_url: "https://i.imgur.com/CpBVc05.mp4",
            mimetype: "video/mp4",
          },
        },
        {
          attachment: {
            name: "Quick_Chat_App_Screenshot.png",
            file_url: "https://i.imgur.com/sQWRjCJ.png",
            mimetype: "image/png",
          },
        },
        {
          attachment: {
            name: "Quick_Chat_App_Description.pdf",
            file_url:
              "https://res.cloudinary.com/dhz0mnlc2/image/upload/v1688662504/assets/quick-chat_ntyhuo.pdf",
            mimetype: "application/pdf",
          },
        },
      ].map((item, index) => {
        item = {
          ...item,
          sender: creator_id,
          chat_id: chat_id,
          message_id: lastMsgId,
          attachment: {
            ...item.attachment,
            key: index.toString(),
            isUploading: "Completed",
          },
        };
        return item;
      });

      const chatBotFiles = await File.insertMany(chatBotAttachments).then(
        (docs) => {
          if (Array.isArray(docs)) {
            return docs.map((doc) => doc._id.toString());
          }
          return [];
        }
      );

      await Chat.findOneAndUpdate(
        {
          _id: chat_id,
          "messages._id": lastMsgId,
        },
        {
          $set: { "messages.$.attachments": chatBotFiles },
        },
        { new: true }
      );
    }

    return bs_token;
  } catch (err) {
    console.error(err);
  }
};

const valdateToken = () => {
  //To do: Generate bs_token through jwt and validate token here
};

const encryptData = (content) => {
  const cipher = crypto.createCipheriv(
    config.encryption.algorithm,
    config.encryption.securityKey,
    config.encryption.initVector
  );

  let encryptedData = cipher.update(content, "utf8", "hex");
  encryptedData += cipher.final("hex");

  return encryptedData;
};

const decryptData = (content) => {
  const decipher = crypto.createDecipheriv(
    config.encryption.algorithm,
    config.encryption.securityKey,
    config.encryption.initVector
  );

  let decryptedData = decipher.update(content, "hex", "utf-8");
  decryptedData += decipher.final("utf8");

  return decryptedData;
};

export {
  generateChatUrl,
  getTokenFromCookie,
  handleToken,
  encryptData,
  decryptData,
};
