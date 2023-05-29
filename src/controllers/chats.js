import { generateChatUrl } from "../utils";

const createChat = (req, res) => {
  try {
    const bs_token = req.body.bs_token;
    console.log("generateChatUrl", generateChatUrl());

    res.send("createChat");
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

export { createChat };
