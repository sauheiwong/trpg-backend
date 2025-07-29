import mongoose from "mongoose";

const Schema = mongoose.Schema;

const characterChatMessageSchema = new Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "characterChat",
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "model", "system"],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

characterChatMessageSchema.index({ gameId: 1, timestamp: -1 });

export default mongoose.model(
  "characterChatMessage",
  characterChatMessageSchema
);
