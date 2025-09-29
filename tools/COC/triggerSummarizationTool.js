// Import the socket.io instance for real-time communication with clients.
import { io } from "../../app.js";
import { Type, GoogleGenAI } from "@google/genai";

import Game from "../../models/gameModel.js";
import COCCharacterModel from "../../models/COCCharacterModel.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API });

const buffer = 10;

const triggerSummarization = async(game, messages) => {
    console.log(`game ${game._id} triggering summrization`);

    const messagesToSummarize = messages.slice(game.lastSummarizedMessageIndex);

    if (messagesToSummarize.length === 0) {
        console.log("No new messages to summarize.");
        return;
    }

    const character = await COCCharacterModel.findById(game.characterId)

    const contentToSummarize = `
    # 角色描述:
    ${character.description}
    # 舊的摘要:
    ${game.KPmemo || '無'}

    # 需要被摘要的新對話:
    ${messagesToSummarize.map(m => `${m.role}: ${m.content}`).join('\n')}
    `

    const summaryPrompt = `
    你是一個TRPG遊戲的紀錄員。請閱讀以下舊的摘要和完整的對話歷史，生成一段新的、精簡的、涵蓋所有關鍵劇情點的摘要，要包括故事的目標、地點、時代、NPC、NPC們與主角的關係和名字。不需要包含主角資料，因為KP有主角的角色卡。
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