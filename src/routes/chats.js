import express from "express";
import { createChat, uploadFile } from "../controllers";

const router = express.Router();

router.post("/create", createChat);
router.post("/upload", uploadFile);

export default router;
