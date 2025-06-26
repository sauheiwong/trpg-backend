import mongoose from "mongoose";
import validator from "validator";
import plm from "passport-local-mongoose";

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: [true, "Please provide an email address"],
    unique: true,
    lowercase: true,
    trim: true,
    validate: [validator.isEmail, "Invalid email"],
  },
});

userSchema.plugin(plm);

export default mongoose.model("User", userSchema);
