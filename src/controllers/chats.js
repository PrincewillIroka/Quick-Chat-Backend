import { generateChatUrl } from "../utils";
import Chat from "../models/Chat";

const createChat = async (req, res) => {
  try {
    const bs_token = req.body.bs_token;
    const chat_url = generateChatUrl();

    //Todo: Ensure chat_url is unique from others in the db Chat model

    const newChat = await Chat.create({ creator_id: bs_token, chat_url });
    res.send({ newChat });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

export { createChat };
