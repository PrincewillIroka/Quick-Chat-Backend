import express from "express";
import { getChats, authenticateUser, updateUser } from "../controllers";
import { validator, authenticateUserData, getChatsData } from "../validators";

const router = express.Router();

router.post("/getChats", getChatsData, validator, getChats);
router.post(
  "/authenticateUser",
  authenticateUserData,
  validator,
  authenticateUser
);
router.patch("/updateUser", updateUser);

export default router;
