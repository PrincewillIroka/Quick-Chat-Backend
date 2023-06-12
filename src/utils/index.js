import cookie from "cookie";
import { v4 as uuidv4 } from "uuid";
import User from "../models/User";
import Chat from "../models/Chat";

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
    const user = await User.create({ bs_token, name: "New User" });
    const creator_id = user._id;
    const participants = [creator_id];
    const chat_url = generateChatUrl();

    // Create default chat for new user
    await Chat.create({
      creator_id,
      chat_url,
      participants,
    });
  }

  return bs_token;
};

const valdateToken = () => {
  //To do: Generate bs_token through jwt and validate token here
};

export { generateChatUrl, getTokenFromCookie, handleToken };
