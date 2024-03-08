require("dotenv").config();

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import fileUpload from "express-fileupload";
import path from "path";

import config from "./config";
import router from "./routes";
import db from "./db";
import sockets from "./sockets";
import { setUpChatBot } from "./controllers/users";
import redis from "./redis";
import rateLimitMiddleware from "./middlewares/rateLimit";

const app = express();

const port = config.port;

const server = http.createServer(app);
const io = new Server(server);

const whitelist = [config.frontendAppUrl];
const corsOptions = {
  credentials: true,
  origin: function (origin, callback) {
    if (!origin && config.environment !== "production") {
      //for bypassing postman req with no origin && development environment
      return callback(null, true);
    }
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
};

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(
  fileUpload({
    useTempFiles: config.environment !== "production" ? false : true,
    limits: { fileSize: 5 * 1024 * 1024 },
  })
);
app.use(function (req, res, next) {
  // pass socket io as a property of req
  req.io = io;
  next();
});

// app.use(rateLimitMiddleware);

app.use("/api", router);
app.use("/api/assets", express.static(path.join(__dirname, "../assets")));
app.use(
  "/api/static",
  express.static(path.join(__dirname, "../static/chat_images"))
);

server.listen(port, async () => {
  await db.connect();
  console.log(`Server connected on port ${port}...`);
  sockets(io);
  //Set up ChatBot
  setUpChatBot();
  redis.connect();
});

process.on("uncaughtException", function (err) {
  console.error(err.stack);
  console.log("Handles uncaughtException to prevent Node.js from exiting...");
});

export default app;
