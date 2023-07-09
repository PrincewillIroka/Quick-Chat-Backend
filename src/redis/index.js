import { createClient } from "redis";
import config from "../config";

const client = createClient({
  url: config.redisUrl,
});

client.on("connect", () => console.log("Redis Client connected"));
client.on("error", (err) => console.log("Redis Client Error", err));

const connect = async () => {
  await client.connect();
};

const getClient = function () {
  return client;
};

export default { connect, getClient };
