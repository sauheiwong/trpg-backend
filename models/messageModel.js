import mongoose from "mongoose";

const Schema = mongoose.Schema;

const messageSchema = new Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "game",
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

messageSchema.index({ gameId: 1, timestamp: -1 });

export default mongoose.model("message", messageSchema);
