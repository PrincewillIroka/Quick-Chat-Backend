require("dotenv").config();

import express from "express";
import http from "http";
import { Server } from "socket.io";
import cookie from "cookie";
import { v4 as uuidv4 } from "uuid";

import routes from "./routes";
import db from "./db";

const app = express();

const port = process.env.APP_PORT;

const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", routes);

const handleCookie = (headers, isConnectionEvent) => {
  const { cookie: cookieHeaders } = headers;

  let { bs_token } = cookieHeaders ? cookie.parse(cookieHeaders) : {};

  if (!bs_token) {
    const uidv4 = uuidv4();
    bs_token = `${uidv4}_${Date.now()}`;
  }

  if (isConnectionEvent) {
    console.log("a user connected", bs_token);
  }

  return cookie.serialize("bs_token", bs_token, {
    sameSite: "none",
  });
};

io.engine.on("initial_headers", (headers, request) => {
  headers["set-cookie"] = handleCookie(request.headers);
});

io.on("connection", (socket, request) => {
  socket.handshake.headers["set-cookie"] = handleCookie(
    socket.handshake.headers,
    true
  );
});

server.listen(port, async () => {
  await db.connect();

  console.log(`Connected on port ${port}...`);
});

export default app;
