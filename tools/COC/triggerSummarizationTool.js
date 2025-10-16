// Import the socket.io instance for real-time communication with clients.
import { io } from "../../app.js";
import { Type, GoogleGenAI } from "@google/genai";

import Game from "../../models/gameModel.js";
import COCGameSummaryModel from "../../models/COCGameSummaryModel.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API });

const buffer = 10;
const MAX_RETRIES = 5;
const model = 'gemini-2.5-flash-preview-09-2025';


const summarySchema = {
    type: Type.OBJECT,
    properties: {
        goldenFacts: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING,
                description: "核心事實的全新重大事件"
            }
        },
        recentEvents: {
            type: Type.STRING,
            description: "近期事件"
        },
        npcDescription: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING }
                },
                required: ["name", "description"]
                
            }
        }
    },
    required: ["goldenFacts", "recentEvents"]
};

const triggerSummarization = async({game, gameId, messages, character, language}) => {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++){
        try {
            console.log(`game ${gameId} triggering summrization`);

            const messagesToSummarize = messages.slice(game.lastSummarizedMessageIndex);

            if (messagesToSummarize.length === 0) {
                console.log("No new messages to summarize.");
                return;
            }

            let summary = await COCGameSummaryModel.findOne({ gameId: gameId });

            if (!summary) {
                summary = await COCGameSummaryModel.create({ gameId: gameId });
            }

            const contentToSummarize = `你是一位專業的 TRPG 遊戲記錄分析師。你的任務是閱讀舊的遊戲摘要和一段新的對話，然後根據指定的 JSON 結構，精準地提取和生成資訊。

# 舊摘要 (僅供參考):
${JSON.stringify(summary.summary, null, 2)}

# 主角角色描述 (僅供參考):
${character.description}

# 新對話 (主要分析目標):
${messagesToSummarize.map(m => `${m.role}: ${m.content}`).join('\n')}

# 你的任務:
請**僅分析「新對話」**，並根據以下規則填充 JSON 欄位。你的輸出必須嚴格遵守要求的 JSON Schema。

1.  **"goldenFacts"**: 
    分析**「新對話」**，從中提取出足以成為核心設定或不可逆轉的**全新重大事件**。
    - **只回傳新發現的事件**。
    - 如果沒有新的重大事件發生，請回傳一個空陣列 []。
    - **絕對不要**包含「舊摘要」中已經存在的事實。

2.  **"recentEvents"**:
    **完全基於「新對話」**的內容，撰寫一段精簡的摘要，描述最近發生的關鍵情節、場景或互動。

3.  **"npcDescription"**:
    綜合參考「舊摘要」和「新對話」，**重新生成一份完整且最新的 NPC 列表**。
    - 這份列表應包含所有已登場的關鍵人物。
    - 更新那些在「新對話」中狀態或關係有變化的 NPC。
    - 確保 NPC 列表是全面的，不要因為 NPC 沒在「新對話」中出現就遺漏他。

你的輸出將被程式直接解析，請專注於提供準確的數據。
`
            const summaryPrompt = `**指示**：
- 在更新檔案時，**絕對不能刪除或修改 [核心事實]** 中已確立的事件，只能補充新的重大發現。
- [近期事件] 應專注於最新的對話內容。
- **語言**：必須使用 **${language}** 來生成摘要。
`

            // console.log(`contentToSummarize:\n${contentToSummarize}`);

            const result = await ai.models.generateContent({
                model: model,
                contents: [{ role: "user", parts: [{ text: contentToSummarize }]}],
                config:{
                    systemInstruction: summaryPrompt,
                    responseMimeType: "application/json",
                    responseSchema: summarySchema
                }
            })

            const { promptTokenCount, candidatesTokenCount, totalTokenCount, thoughtsTokenCount } = result.usageMetadata;

            const outputTokens = (candidatesTokenCount || 0) + (thoughtsTokenCount || 0);

            console.log(`New summary was generated. inputToken: ${promptTokenCount}, outputToken: ${outputTokens}`)

            const newSummary = JSON.parse(result.text);

            console.log(`newSummary: ${JSON.stringify(newSummary, null, 2)}`);

            const newAnchorIndex = messages.length - buffer;
            await Game.findByIdAndUpdate(gameId, {
                $set: {
                    lastSummarizedMessageIndex: newAnchorIndex < 0 ? 0 : newAnchorIndex, // 確保錨點不小於 0
                },
                $inc: {
                    "tokenUsage.inputTokens": promptTokenCount ?? 0,
                    "tokenUsage.outputTokens": outputTokens,
                    "tokenUsage.totalTokens": totalTokenCount ?? 0,
                }
            });

            summary.summary.goldenFacts.push(...newSummary.goldenFacts);
            summary.summary.recentEvents = newSummary.recentEvents;
            summary.summary.npcDescription = newSummary.npcDescription;

            summary.tokenUsage = {
                inputTokens: summary.tokenUsage.inputTokens + promptTokenCount ?? 0,
                outputTokens: summary.tokenUsage.outputTokens + outputTokens,
                totalTokens: summary.tokenUsage.totalTokens + totalTokenCount ?? 0,
            }

            await summary.save();

            console.log(`game ${gameId} summrization success. New anchor is at index ${newAnchorIndex}`)

            io.to(gameId.toString()).emit("system:message", { message: "New summary have been created" })
            io.to(gameId.toString()).emit("summary:updated", { newSummary: {
                ...newSummary,
                goldenFacts: summary.summary.goldenFacts,
            } })
            return;
        } catch (e) {
            console.error(`Error⚠️: fail to generate a new summary: ${e}`)
            io.to(gameId).emit("system:error", { functionName: "triggerSummarization", error: e.message });
            return;
        }
    }
}

export default {
    triggerSummarization,
};