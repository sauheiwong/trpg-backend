import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "passport";
import { router } from "./routes/router.js";
import { notFound } from "./handlers/errorHandlers.js";
import configurePassport from "./config/passport.js";
import methodOverride from "method-override";
import "./handlers/passport.js";

// create express app
export const app = express();

// takes raw requests and sticks them onto req.body
app.use(express.json());

// for parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(morgan("dev")); // logging middleware
app.use(cookieParser()); // cookie parsing middleware

app.use(
  cors({
    origin: "https://trpg-vue-frontend.vercel.app",
    credentials: true,
  })
);

app.use(passport.initialize()); // passport middleware
configurePassport(passport);

app.use("/", router);

app.use(notFound);
