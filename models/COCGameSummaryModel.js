import mongoose from "mongoose";

const Schema = mongoose.Schema;

const NPCSchema = new Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
}, { _id: false });

const COCGameSummarySchema = new Schema({
    gameId: {
        type: Schema.Types.ObjectId,
        ref: "game",
        required: true,
        unique: true,
    },
    summary: { 
        // 核心事實：一個只會增加、不會被修改的字串陣列
        goldenFacts: {
            type: [String],
            default: []
        },
        // 近期事件：一段文字，每次都會被 AI 的新輸出完全覆蓋
        recentEvents: {
            type: String,
            default: "",
        },
        // NPC 關係：一個物件陣列，每個物件都遵循上面定義的 NPCSchema 結構
        // 每次也都會被 AI 的新輸出完全覆蓋
        npcDescription: {
            type: [NPCSchema],
            default: [],
        }
    },
    tokenUsage: {
        inputTokens: { type: Number, default: 0 },
        outputTokens: { type: Number, default: 0 },
        totalTokens: { type: Number, default: 0 },
    },
}, {
    // 啟用 timestamps 會自動幫你管理 createdAt 和 updatedAt 欄位
    // 這比手動設定 default: Date.now 更好，因為它會在每次更新時自動更新 updatedAt
    timestamps: true, 
});

// COCGameSummarySchema.index({ gameId: 1 });

export default mongoose.model("COCGameSummary", COCGameSummarySchema);
