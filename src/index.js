const express = require("express");

require("dotenv").config();

const app = express();

const routes = require("./routes");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const port = process.env.APP_PORT;

app.use("/", routes);

app.listen(port, () => {
  console.log(`Connected on port ${port}...`);
});

module.exports = app;
