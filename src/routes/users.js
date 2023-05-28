import express from "express";
import { myChats } from "../controllers";

const router = express.Router();

router.get("/myChats", myChats);

export default router;
