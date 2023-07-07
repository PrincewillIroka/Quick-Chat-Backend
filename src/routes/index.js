import express from "express";
import users from "./users";
import chats from "./chats";
import bookmarks from "./bookmarks";

const router = express.Router();

router.get("/health", async (req, res) => {
  res.send({ success: true, message: "App is running..." });
});
router.use("/users", users);
router.use("/chats", chats);
router.use("/bookmarks", bookmarks);

export default router;