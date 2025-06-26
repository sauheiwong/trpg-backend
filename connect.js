import mongoose from "mongoose";

export const connect = (url) => mongoose.connect(url);
