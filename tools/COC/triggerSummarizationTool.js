// Import the socket.io instance for real-time communication with clients.
import { io } from "../../app.js";
import { Type, GoogleGenAI } from "@google/genai";

import Game from "../../models/gameModel.js";
import COCGameSummaryModel from "../../models/COCGameSummaryModel.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API });

const buffer = 10;
const MAX_RETRIES = 5;
const INITAIL_DELAY_MS = 1000;
const model = "gemini-2.5-flash-preview-09-2025";

const summarySchema = {
  type: Type.OBJECT,
  properties: {
    goldenFacts: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
        description: "核心事實的全新重大事件",
      },
    },
    recentEvents: {
      type: Type.STRING,
      description: "近期事件",
    },
    npcDescription: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ["name", "description"],
      },
    },
  },
  required: ["goldenFacts", "recentEvents", "npcDescription"],
};

const retryMessages = {
  0: "Brewing a little more coffee... Gemini is giving it another shot! ☕",
  1: "Hmm, that didn't quite work. Gemini is trying a different angle! 🤔",
  2: "Whoops, a little turbulence! Rerouting the connection now... ✈️",
  3: "Just a moment! Gemini is tightening some digital screws... 🔩",
  4: "It looks like our Gemini KP is facing some stubborn network issues. \nWe've made several attempts to resolve it automatically. \nCould you please try again shortly?🙇‍♀️ \nOur team has been alerted if the issue persists.",
};

const triggerSummarization = async ({
  game,
  gameId,
  messages,
  character,
  language,
}) => {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    let lastError = null;
    try {
      console.log(`game ${gameId} triggering summrization`);

      const messagesToSummarize = messages.slice(
        game.lastSummarizedMessageIndex
      );

      if (messagesToSummarize.length === 0) {
        console.log("No new messages to summarize.");
        return;
      }

      let summary = await COCGameSummaryModel.findOne({ gameId: gameId });

      if (!summary) {
        summary = await COCGameSummaryModel.create({ gameId: gameId });
      }

      const contextSummary = {
        goldenFacts: summary.summary.goldenFacts,
        npcDescription: summary.summary.npcDescription,
      };

      const contentToSummarize = `你是一位專業的 TRPG 遊戲記錄分析師。你的任務是閱讀舊的遊戲摘要和一段新的對話，然後根據指定的 JSON 結構，精準地提取和生成資訊。

# 舊摘要 (僅供參考):
${JSON.stringify(contextSummary, null, 2)}

# 主角角色描述 (僅供參考):
${character.description}

# 新對話 (主要分析目標):
${messagesToSummarize.map((m) => `${m.role}: ${m.content}`).join("\n")}

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
`;
      const summaryPrompt = `**指示**：
- 在更新檔案時，**絕對不能刪除或修改 [核心事實]** 中已確立的事件，只能補充新的重大發現。
- [近期事件] 應專注於最新的對話內容。
- **語言**：必須使用 **${language}** 來生成摘要。
`;

      const result = await ai.models.generateContent({
        model: model,
        contents: [{ role: "user", parts: [{ text: contentToSummarize }] }],
        config: {
          systemInstruction: summaryPrompt,
          responseMimeType: "application/json",
          responseSchema: summarySchema,
        },
      });

      const {
        promptTokenCount,
        candidatesTokenCount,
        totalTokenCount,
        thoughtsTokenCount,
      } = result.usageMetadata;

      const outputTokens =
        (candidatesTokenCount || 0) + (thoughtsTokenCount || 0);

      console.log(
        `New summary was generated. inputToken: ${promptTokenCount}, outputToken: ${outputTokens}`
      );

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
        },
      });

      summary.summary.goldenFacts.push(...newSummary.goldenFacts);
      summary.summary.recentEvents = newSummary.recentEvents;
      if (newSummary.npcDescription) {
        summary.summary.npcDescription = newSummary.npcDescription;
      }

      summary.tokenUsage = {
        inputTokens: summary.tokenUsage.inputTokens + promptTokenCount ?? 0,
        outputTokens: summary.tokenUsage.outputTokens + outputTokens,
        totalTokens: summary.tokenUsage.totalTokens + totalTokenCount ?? 0,
      };

      await summary.save();

      console.log(
        `game ${gameId} summrization success. New anchor is at index ${newAnchorIndex}`
      );

      io.to(gameId).emit("system:message", {
        message:
          "New summary have been created, please click the infor icon on the right top.",
      });
      io.to(gameId).emit("summary:updated", {
        newSummary: {
          ...newSummary,
          goldenFacts: summary.summary.goldenFacts,
        },
      });
      return;
    } catch (error) {
      console.error(`Error⚠️: fail to generate a new summary: ${error}`);
      lastError = error;
      if (
        error.message.includes("500") ||
        error.message.includes("503") ||
        error.message.includes("MALFORMED_FUNCTION_CALL")
      ) {
        if (attempt === MAX_RETRIES - 1) {
          console.error("Error ⚠️: Gemini API meet max retries. Stop retry");
          io.to(gameId).emit("message:error", {
            error: retryMessages[`${attempt}`],
            message: "model fail to generate a new summary",
          });
          throw new Error("Error ⚠️: Gemini fail to generate a new summary🤦");
        }
        io.to(gameId).emit("system:message", {
          message: retryMessages[`${attempt}`],
          keepLoading: true,
        });

        const delay = INITAIL_DELAY_MS * Math.pow(2, attempt);
        const jitter = Math.random() * 1000;
        const waitTime = delay + jitter;

        console.log(
          `Gemini API Error in ${attempt + 1} try: Error ⚠️: ${error.message}`
        );
        console.log(`Retry 🤦 at ${(waitTime / 1000).toFixed(2)} second later`);

        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else {
        console.error(
          `Non retry Error ⚠️: fail to generate summary\n${JSON.stringify(
            error,
            null,
            2
          )}`
        );
        io.to(gameId).emit("system:error", {
          functionName: "triggerSummarization",
          error: error.message,
        });
        return;
      }
    }
  }
};

export default {
  triggerSummarization,
};
