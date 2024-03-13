import express from "express";
import { createChat, uploadFile, updateAccessRight } from "../controllers";
import { validator, createChatData } from "../validators";

const router = express.Router();

router.post("/create", createChatData, validator, createChat);
router.post("/upload", uploadFile);
router.put("/updateAccessRight", updateAccessRight);

export default router;
