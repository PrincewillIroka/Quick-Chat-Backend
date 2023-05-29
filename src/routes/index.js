import express from "express";
import users from "./users";
import chats from "./chats";

const router = express.Router();

router.use("/users", users);
router.use("/chats", chats);

export default router;