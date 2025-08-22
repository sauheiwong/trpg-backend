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
const app = express();

// takes raw requests and sticks them onto req.body
app.use(express.json());

// for parsing application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(morgan("dev")); // logging middleware
app.use(cookieParser()); // cookie parsing middleware

// app.use(
//   cors({
//     origin: "https://trpg-vue-frontend.vercel.app",
//     credentials: true,
//   })
// );

app.use(cors());

app.use(passport.initialize()); // passport middleware
configurePassport(passport);

app.use("/", router);

// socket.io
import http from "http"
import { Server } from "socket.io";
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://frontend:5173",
        methods: ["GET", "POST"]
    }
})

io.on("connection", (socket) => {
    console.log("a user connected: ", socket.id);

    socket.on("joinGame", (gameId) => {
        console.log(`Socket ${socket.id} is joining game room ${gameId}`);
        socket.join(gameId);
    });

    socket.on("disconnect", () => {
        console.log("user disconnected: ", socket.id);
    });
});

app.use(notFound);

export { app, server, io };
