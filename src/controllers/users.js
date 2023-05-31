import Chat from "../models/Chat";
import User from "../models/User";

const getChats = async (req, res) => {
  try {
    const bs_token = req.query.bs_token;

    const user = await User.findOne({ bs_token });
    const user_id = user?._id;

    const chats = await Chat.find({
      $or: [{ creator_id: user_id }, { participants: { $in: [user_id] } }],
    })
      .populate([
        {
          path: "participants",
          select: ["name", "photo"],
        },
        {
          path: "messages.sender",
          select: ["name", "photo"],
        },
      ])
      .exec()
      .then((chatsFound) => chatsFound);

    res.send({ chats });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

export { getChats };
