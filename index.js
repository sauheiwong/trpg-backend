import dotenv from "dotenv";
dotenv.config();
import { connect } from "./connect.js";
import configService from "./services/config.service.js"

// TODO: eventually import all our models here
import "./models/userModel.js";

// Connect to MongoDB
try {
  await connect(process.env.DB_CONN);
  console.log("MongoDB connected");

  const { server } = await import("./app.js");
  console.log("app.js loaded");

  // Load configuration into cache right after connecting to DB
  await configService.loadConfig(true); // Force load on startup

  //socket.io
  server.listen(process.env.PORT, () => {
    console.log(`Sever with socket.io running on port ${process.env.PORT}`)
  })
} catch (error) {
  console.error("⚠️ Error connecting to MongoDB:", error);
}
