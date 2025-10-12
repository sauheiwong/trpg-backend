// Import the socket.io instance for real-time communication with clients.
import { io } from "../../app.js";
import { Type, GoogleGenAI } from "@google/genai";

import Game from "../../models/gameModel.js";
import COCCharacterModel from "../../models/COCCharacterModel.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API });

const buffer = 10;

const triggerSummarization = async(game, messages, language) => {
    console.log(`game ${game._id} triggering summrization`);

    const messagesToSummarize = messages.slice(game.lastSummarizedMessageIndex);

    if (messagesToSummarize.length === 0) {
        console.log("No new messages to summarize.");
        return;
    }

    const character = await COCCharacterModel.findById(game.characterId)

    const contentToSummarize = `
你是一個 TRPG 遊戲的檔案管理員。請閱讀以下的 JSON 格式的舊遊戲檔案以及最新的對話紀錄。你的任務是生成一個**新的 JSON 物件**來更新遊戲狀態。

# 舊的遊戲檔案 (JSON):
${JSON.stringify(game.KPmemo, null, 2)}

# 需要被摘要的新對話:
${messagesToSummarize.map(m => `${m.role}: ${m.content}`).join('\n')}

# 你的任務:
根據新對話，生成一個全新的 JSON 物件。請嚴格遵守以下規則：

1.  **"goldenFacts" (核心事實)**: 
    - 複製舊檔案中的所有 "goldenFacts"。
    - 檢查新對話中是否有**足以成為核心事實的全新重大事件**。如果有的話，將其作為新的字串**附加**到 "goldenFacts" 陣列的末尾。如果沒有，則保持原樣。

2.  **"recentEvents" (近期事件)**:
    - **完全忽略**舊檔案中的 "recentEvents"。
    - 根據新對話的內容，重新生成一份涵蓋最近 1-3 個場景的簡潔摘要。

3.  **"npcRelationships" (NPC 關係)**:
    - **完全忽略**舊檔案中的 "npcRelationships"。
    - 根據新對話和已有的核心事實，重新生成一份所有關鍵 NPC 的最新狀態和關係描述。

**輸出格式必須是嚴格的 JSON。**
`
    const summaryPrompt = `
**指示**：
- 在更新檔案時，**絕對不能刪除或修改 [核心事實]** 中已確立的事件，只能補充新的重大發現。
- [近期事件] 應專注於最新的對話內容。
- **語言**：必須使用 **${language}** 來生成摘要。
`

    const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: contentToSummarize }]}],
        config:{
            systemInstruction: summaryPrompt
        }
    })

    const { promptTokenCount, candidatesTokenCount, totalTokenCount, thoughtsTokenCount } = result.usageMetadata;

    const outputTokens = (candidatesTokenCount || 0) + (thoughtsTokenCount || 0);

    console.log(`New summary was generated. inputToken: ${promptTokenCount}, outputToken: ${outputTokens}`)

    const newSummary = result.text;

    const newAnchorIndex = messages.length - buffer;
    await Game.findByIdAndUpdate(game._id, {
        $set: {
            KpMemo: newSummary,
            lastSummarizedMessageIndex: newAnchorIndex < 0 ? 0 : newAnchorIndex, // 確保錨點不小於 0
        },
        $inc: {
            "tokenUsage.inputTokens": promptTokenCount ?? 0,
            "tokenUsage.outputTokens": outputTokens,
            "tokenUsage.totalTokens": totalTokenCount ?? 0,
        }
    });

    console.log(`game ${game._id} summrization success. New anchor is at index ${newAnchorIndex}`)

    io.to(game._id).emit("systemMessage:received", { message: "New summary have been created" })
    return;
}

export default {
    triggerSummarization,
};