import express from "express";
import { createChat } from "../controllers";

const router = express.Router();

router.post("/create", createChat);

export default router;
