require("dotenv").config();

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

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

app.use("/api", router);

server.listen(port, async () => {
  await db.connect();
  console.log(`Server connected on port ${port}...`);
  sockets(io);
});

export default app;
