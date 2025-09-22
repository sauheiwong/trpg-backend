import mongoose from "mongoose";

const Schema = mongoose.Schema;

const messageSchema = new Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "game",
    required: true,
  },
  message_type: {
    type: String,
    enum: [
      "user_prompt",
      "model_text_response",
      "model_function_call",
      "tool_function_result",
    ],
    required: true,
  },
  role: {
    type: String,
    enum: ["user", "model", "system"], // 沒有function 只有user and model system是用在前端顯示 輸入歷史對話時會變回user
    required: true,
  },
  // --- 內容欄位 (根據 message_type 選擇性使用) ---
  content: {
    type: String,
    required: false, // 改為非必需，因為 function call 和 result 不會有這個欄位
  },
  function_call: {
    name: { type: String },
    args: { type: mongoose.Schema.Types.Mixed }, // 使用 Mixed 類型以容納任意結構的 JSON object
  },
  function_result: {
    name: { type: String },
    result: { type: mongoose.Schema.Types.Mixed },
  },

  // --- 成本與時間戳記 ---
  usage: {
    inputTokens: { type: Number },
    outputTokens: { type: Number },
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

messageSchema.index({ gameId: 1, timestamp: -1 });

export default mongoose.model("message", messageSchema);
