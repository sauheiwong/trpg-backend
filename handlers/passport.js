import passport from "passport";
import User from "../models/userModel.js";

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

console.log("passport.js loaded");
