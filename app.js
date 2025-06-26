import express from "express";
import morgan from "morgan";
import session from "express-session";
import MongoStore from "connect-mongo";
import cookieParser from "cookie-parser";
import passport from "passport";
import { router } from "./routes/router.js";
import { notFound } from "./handlers/errorHandlers.js";
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

// session middleware
app.use(
  session({
    secret: process.env.PASSPORT_SECRET,
    key: process.env.PASSPORT_COOKIE_KEY,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.DB_CONN, // store session in mongoDB (not in memory)
    }),
  })
);

app.use(passport.initialize()); // passport middleware
app.use(passport.session()); // persistent login sessions

app.use("/", router);

app.use(notFound);
