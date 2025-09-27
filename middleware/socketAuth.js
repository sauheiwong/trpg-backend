import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

export const socketAuthMiddleware = async (socket, next) => {
    console.log("checking jwt");
    const token = socket.handshake.auth.token;

    if(!token) {
        console.error("Authentication error: Token note provided")
        return next(new Error("Authentication error: Token note provided"));
    }

    // console.log(token);

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const user = await User.findById(decoded.id).select('-password');

        if(!user) {
            console.error("Authentication error: User not found")
            return next(new Error("Authentication error: User not found"));
        }

        socket.user = user.toObject();
        next();
    } catch (error) {
        console.error("--- ERROR in Socket Auth Middleware ---");
        console.error("Error message:", error.message);
        return next(new Error("Authentication error: Invalid token"))
    }
}