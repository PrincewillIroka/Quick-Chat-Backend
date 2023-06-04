import express from "express";
import { getChats, authenticateUser } from "../controllers";

const router = express.Router();

router.get("/getChats", getChats);
router.post("/authenticateUser", authenticateUser);

export default router;
