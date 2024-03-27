import express from "express";
import {
  getChats,
  authenticateUser,
  updateUser,
  updateDarkMode,
  getNotifications,
} from "../controllers";
import {
  validator,
  authenticateUserData,
  getChatsData,
  getNotificationsData,
} from "../validators";

const router = express.Router();

router.post("/getChats", getChatsData, validator, getChats);
router.post(
  "/authenticateUser",
  authenticateUserData,
  validator,
  authenticateUser
);
router.patch("/updateUser", updateUser);
router.patch("/updateDarkMode", updateDarkMode);
router.post(
  "/getNotifications",
  getNotificationsData,
  validator,
  getNotifications
);

export default router;
