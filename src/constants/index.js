import config from "../config";

export const CHAT_BOT_SETUP_MESSAGES = [
  "Hello, welcome to QuickChat app.",
  "Click on Create new chat to create a new chat.",
  "Then copy the chat link, and send to anyone you want to chat with.",
  "",
];

export const GPT_PARAMETERS = [
  {
    role: "system",
    content: "You are a chatbot that can chat to multiple users.",
  },
  {
    role: "user",
    content: "",
  },
];
