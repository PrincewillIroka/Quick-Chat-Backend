import Bookmark from "../models/Bookmark";

const addBookmark = async (req, res) => {
  try {
    const { creator_id, chat_id } = req.body;

    let newBookmark = await Bookmark.create({
      creator_id,
      chat_id,
    });
    res.send({ newBookmark });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

const getBookmarks = async (req, res) => {
  try {
    const { creator_id } = req.body;

    let bookmarks = await Bookmark.find({
      creator_id,
    });
    res.send({ bookmarks });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

const deleteBookmark = async (req, res) => {
  try {
    const { creator_id, bookmark_id } = req.body;

    const deletedBookmark = await Bookmark.findOneAndDelete(
      {
        _id: bookmark_id,
        creator_id,
      },
      {
        writeConcern: {
          w: 1,
          j: true,
        },
      }
    );
    res.send({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500);
  }
};

export { addBookmark, getBookmarks, deleteBookmark };
