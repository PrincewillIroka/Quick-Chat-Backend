import express from "express";
import { getChats, authenticateUser, updateUser } from "../controllers";

const router = express.Router();

router.post("/getChats", getChats);
router.post("/authenticateUser", authenticateUser);
router.patch("/updateUser", updateUser);

export default router;
