import express from "express";
import {
  createChat,
  uploadFile,
  updateAccessRight,
  renameChat,
} from "../controllers";
import { validator, createChatData } from "../validators";

const router = express.Router();

router.post("/create", createChatData, validator, createChat);
router.post("/upload", uploadFile);
router.put("/updateAccessRight", updateAccessRight);
router.patch("/rename", renameChat);

export default router;
