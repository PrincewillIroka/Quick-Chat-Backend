import mongoose from "mongoose";
import cookie from "cookie";
import { v4 as uuidv4 } from "uuid";
import User from "../models/User";
import Chat from "../models/Chat";
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
      name: `New User ${userNameIndex}`,
    });

    const chatBot = await User.findOne({ isChatBot: true });

    const creator_id = user._id;
    const chatBot_id = chatBot._id;
    const participants = [chatBot_id, creator_id];
    const chat_url = generateChatUrl();

    let chatBotMessages = [
      "Hello, welcome to QuickChat app.",
      "Click on Start new conversation to create a new chat.",
      "Then copy the chat link, and send to anyone you want to chat with.",
    ];

    chatBotMessages = chatBotMessages.reduce((acc, cur) => {
      const message_id = new ObjectIdType();
      cur = {
        content: cur,
        sender: chatBot_id,
        createdAt: new Date(),
        _id: message_id,
      };
      acc = acc.concat([cur]);
      return acc;
    }, []);

    // Create default chat for new user & message from QuickChat bot
    await Chat.create({
      creator_id,
      chat_url,
      participants,
      messages: chatBotMessages,
    });
  }

  return bs_token;
};

const valdateToken = () => {
  //To do: Generate bs_token through jwt and validate token here
};

export { generateChatUrl, getTokenFromCookie, handleToken };
