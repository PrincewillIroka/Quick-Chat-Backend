require("dotenv").config();

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import fileUpload from "express-fileupload";

import config from "./config";
import router from "./routes";
import db from "./db";
import sockets from "./sockets";

const app = express();

const port = config.port;

const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cors({
    credentials: true,
    origin: config.frontendAppUrl,
  })
);
app.use(cookieParser());
app.use(
  fileUpload({ useTempFiles: true, limits: { fileSize: 5 * 1024 * 1024 } })
);
app.use(function (req, res, next) {
  // pass socket io as a property of req
  req.io = io;
  next();
});

app.use("/api", router);

server.listen(port, async () => {
  await db.connect();
  console.log(`Server connected on port ${port}...`);
  sockets(io);
});

process.on("uncaughtException", function (err) {
  console.error(err.stack);
  console.log("Handles uncaughtException to prevent Node.js from exiting...");
});

export default app;
