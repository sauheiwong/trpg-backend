import mongoose from "mongoose";

const Schema = mongoose.Schema;

const characterChatSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  characterId: {
    type: Schema.Types.ObjectId,
    ref: "character",
    required: true,
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

characterChatSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model("characterChat", characterChatSchema);
