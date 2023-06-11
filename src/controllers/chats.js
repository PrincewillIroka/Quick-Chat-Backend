import { generateChatUrl } from "../utils";
import Chat from "../models/Chat";

const createChat = async (req, res) => {
  try {
    const { creator_id, passcode, chat_name } = req.body;
    const chat_url = generateChatUrl(); //Todo: Ensure chat_url is unique from others in the db Chat model

    const participants = [creator_id];

    let newChat = await Chat.create({
      creator_id,
      chat_url,
      passcode,
      participants,
      chat_name,
    });
    newChat = await newChat.populate([
      {
        path: "participants",
        select: ["name", "photo"],
      },
    ]);
    res.send({ newChat });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

export { createChat };
