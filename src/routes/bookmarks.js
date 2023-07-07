import express from "express";
import { addBookmark, getBookmarks, deleteBookmark } from "../controllers";
import {
  validator,
  addBookmarkData,
  getBookmarksData,
  deleteBookmarkData,
} from "../validators";

const router = express.Router();

router.post("/add", addBookmarkData, validator, addBookmark);
router.post("/", getBookmarksData, validator, getBookmarks);
router.delete("/delete", deleteBookmarkData, validator, deleteBookmark);

export default router;
