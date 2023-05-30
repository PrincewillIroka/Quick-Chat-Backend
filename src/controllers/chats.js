import { generateChatUrl } from "../utils";
import Chat from "../models/Chat";

const createChat = async (req, res) => {
  try {
    const bs_token = req.body.bs_token;
    const chat_url = generateChatUrl();

    //Todo: Ensure chat_url is unique from others in the db Chat model

    const new_chat = await Chat.create({ creator_id: bs_token, chat_url });
    res.send({ new_chat });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

export { createChat };
