import express from "express";
import { createChat, uploadFile } from "../controllers";
import { validator, createChatData } from "../validators";

const router = express.Router();

router.post("/create", createChatData, validator, createChat);
router.post("/upload", uploadFile);

export default router;
