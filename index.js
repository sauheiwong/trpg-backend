import dotenv from "dotenv";
dotenv.config();
import { connect } from "./connect.js";

// TODO: eventually import all our models here
import "./models/userModel.js";

// Connect to MongoDB
try {
  await connect(process.env.DB_CONN);
  console.log("MongoDB connected");

  const { app } = await import("./app.js");
  console.log("app.js loaded");

  // Start app
  app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  });
} catch (error) {
  console.error("⚠️ Error connecting to MongoDB:", error);
}
