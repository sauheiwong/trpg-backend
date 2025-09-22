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
  characterId: {
    type: Schema.Types.ObjectId,
    ref: "COCCharacter",
  },
  memo: { type: String, default: "" },
  gameState: { 
    type: mongoose.Schema.Types.Mixed,
    default: {
      character: {},
      world: {},
      plot: {}
    },
  },
  KpMemo: { type: String, default: "" },
  lastSummarizedMessageIndex: {
    type: Number,
    default: 0, // 遊戲開始時，錨點在第0則訊息之前
  },
  currentBackgroundImage: {
    type: String,
    default: ""
  },
  backgroundImages: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  tokenUsage: {
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
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
