import { check, body, checkSchema, validationResult } from "express-validator";

export const validator = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).send({ status: 422, error: errors.array() });
  }
  next();
};

export const authenticateUserData = [body("bs_token").isString()];

export const getChatsData = [
  body("bs_token").isString(),
  body("chatUrlParam")
    .optional()
    .isString()
    .withMessage("Invalid Chat URL")
    .trim(),
];

export const createChatData = [
  body("creator_id").isString(),
  body("passcode").optional().isString(),
  body("chat_name")
    .optional()
    .isString()
    .withMessage("Invalid Chat name")
    .trim(),
];

export const addBookmarkData = [
  body("creator_id").isString(),
  body("chat_id").isString(),
];

export const getBookmarksData = [body("creator_id").isString()];

export const deleteBookmarkData = [
  body("creator_id").isString(),
  body("bookmark_id").isString(),
];
