import cookie from "cookie";
import { v4 as uuidv4 } from "uuid";
import User from "../models/User";

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

const handleToken = async (headers) => {
  let bs_token = getTokenFromCookie(headers);

  // valdateToken()

  if (!bs_token) {
    const uidv4 = uuidv4();
    bs_token = `${uidv4}_${Date.now()}`;

    // Create new user here
    await User.create({ bs_token, name: "New User" });
  }

  return bs_token;
};

const valdateToken = () => {
  //To do: Generate bs_token through jwt and validate token here
};

export { generateChatUrl, getTokenFromCookie, handleToken };
