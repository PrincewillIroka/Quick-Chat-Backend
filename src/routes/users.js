import express from "express";
import { getChats } from "../controllers";

const router = express.Router();

router.get("/getChats", getChats);

export default router;
