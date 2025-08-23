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
import { socketAuthMiddleware } from "./middleware/socketAuth.js";

import geminiCOCController from "./controllers/geminiCOCController.js"
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true,
    }
})

io.use(socketAuthMiddleware);

io.on("connection", (socket) => {
    console.log("a user connected: ", socket.id, "Name: ", socket.user.username);

    
    socket.on("game:create", () => {
        console.log(`Received game:create event from ${socket.user.username}`);
        geminiCOCController.handlerNewCOCChat(socket);
    })
    
    socket.on("joinGame", (gameId) => {
        console.log(`Socket ${socket.user.username} is joining game room ${gameId}`);
        socket.join(gameId);
    });

    socket.on("sendMessage", (data) => {
        console.log(`Player ${socket.user.username} sent a message ${data.message} to gemini in room ${data.gameId}`);
        geminiCOCController.handlerUserMessageCOCChat(data, socket.user);
    })


    socket.on("disconnect", () => {
        console.log("user disconnected: ", socket.user.username);
    });
});

app.use(notFound);

export { app, server, io };
