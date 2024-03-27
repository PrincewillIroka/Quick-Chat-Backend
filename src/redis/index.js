import { createClient } from "redis";
import config from "../config";

const client = createClient({
  url: config.redis.redis_url,
});

client.on("connect", () => console.log("Redis Client connected"));
client.on("error", (err) => console.log("Redis Client Error", err));

const connect = async () => {
  await client.connect();
  if (config.redis.can_clear_redis === "true") {
    await client.sendCommand(["FLUSHALL"]);
  }
};

const getClient = () => {
  return client;
};

export default { connect, getClient };
