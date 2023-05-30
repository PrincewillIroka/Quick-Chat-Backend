import Chat from "../models/Chat";

const getChats = async (req, res) => {
  try {
    const bs_token = req.query.bs_token;
    const chats = await Chat.find({
      $or: [{ creator_id: bs_token }, { participants: bs_token }],
    });

    res.send({ chats });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

export { getChats };
