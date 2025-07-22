import mongoose from "mongoose";

const Schema = mongoose.Schema;

const gameSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  title: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

gameSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model("game", gameSchema);
