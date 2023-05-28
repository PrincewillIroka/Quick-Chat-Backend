require("dotenv").config();

import express from "express";
import routes from "./routes";
import db from "./db";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.APP_PORT;

app.use("/", routes);

app.listen(port, async () => {
  await db.connect();

  console.log(`Connected on port ${port}...`);
});

module.exports = app;
