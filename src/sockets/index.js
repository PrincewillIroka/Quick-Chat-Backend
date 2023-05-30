
import cookie from "cookie";
import { v4 as uuidv4 } from "uuid";

const sockets = (io) => {
  // called during the socket handshake
  io.engine.on("initial_headers", (headers, request) => {
    headers["set-cookie"] = handleCookie(request.headers);
  });

  io.on("connection", (socket) => {
    socket.handshake.headers["set-cookie"] = handleCookie(
      socket.handshake.headers,
      true
    );
  });
};


//Todo: Move this to util function
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

export default sockets;
