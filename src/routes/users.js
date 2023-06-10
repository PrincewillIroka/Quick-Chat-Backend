import express from "express";
import { getChats, authenticateUser } from "../controllers";

const router = express.Router();

router.post("/getChats", getChats);
router.post("/authenticateUser", authenticateUser);

export default router;
