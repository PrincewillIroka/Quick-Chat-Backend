require("dotenv").config();
import mongoose from "mongoose";
import config from "../config";

export default {
  connect() {
    try {
      if (config.environment === "development") {
        mongoose.connect(dbString, {
          user: config.db.user,
          pass: config.db.pass,
          authSource: config.db.authSource,
        });
      } else {
        mongoose.connect(config.db.dbConnection);
      }

      mongoose.connection.on("connected", () => {
        console.log("Database connection established");
      });

      mongoose.connection.on("error", (e) => {
        console.log("Database connection error:", e);
      });
    } catch (e) {
      console.log("Database connection error:", e);
    }
  },
  disconnect() {
    try {
      mongoose.disconnect();
    } catch (e) {
      console.log("Database disconnection error:", e);
    }
  },
};
