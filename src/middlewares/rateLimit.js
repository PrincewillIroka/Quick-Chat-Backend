import { validate } from "uuid";

const setRateLimit = require("express-rate-limit");

// Rate limit middleware
const rateLimitMiddleware = setRateLimit({
  windowMs: 60 * 1000,
  max: 50,
  message: "You have exceeded your 50 requests per minute limit.",
  headers: true,
  validate: { xForwardedForHeader: false },
});

export default rateLimitMiddleware;
