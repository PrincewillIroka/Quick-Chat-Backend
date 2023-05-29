require("dotenv").config();

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cookie from "cookie";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

import config from "./config";
import routes from "./routes";
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
    origin: config.frontendAppUrl,
  })
);
app.use(cookieParser());

app.use("/", routes);

const handleCookie = (headers, isConnectionEvent) => {
  const { cookie: cookieHeaders } = headers;

  let { bs_token } = cookieHeaders ? cookie.parse(cookieHeaders) : {};

  if (!bs_token) {
    const uidv4 = uuidv4();
    bs_token = `${uidv4}_${Date.now()}`;
  }

  if (isConnectionEvent) {
    // console.log(bs_token);
    console.log("a user connected");
  }

  return cookie.serialize("bs_token", bs_token);
};

// called during the socket handshake
io.engine.on("initial_headers", (headers, request) => {
  headers["set-cookie"] = handleCookie(request.headers);
});

io.on("connection", (socket) => {
  socket.handshake.headers["set-cookie"] = handleCookie(
    socket.handshake.headers,
    true
  );
  sockets(io);
});

server.listen(port, async () => {
  await db.connect();

  console.log(`Connected on port ${port}...`);
});

export default app;
