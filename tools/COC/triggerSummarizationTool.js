import { GoogleGenerativeAI } from "@google/generative-ai";

import Game from "../../models/gameModel.js";
import COCCharacterModel from "../../models/COCCharacterModel.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);

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
    你是一個TRPG遊戲的紀錄員。請閱讀以下舊的摘要和完整的對話歷史，生成一段新的、精簡的、涵蓋所有關鍵劇情點的摘要，要包括故事的目標、地點、時代、NPC、NPC們與主角的關係和名字
    `

    const sumarizerModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const chat = sumarizerModel.startChat({
        history: [{ role: "user", parts: [{ text: summaryPrompt }]}],
    })
    const result = await chat.sendMessage(contentToSummarize);
    const newSummary = result.response.text();

    const newAnchorIndex = messages.length - buffer;
    await Game.findByIdAndUpdate(game._id, {
        $set: {
            KpMemo: newSummary,
            lastSummarizedMessageIndex: newAnchorIndex < 0 ? 0 : newAnchorIndex, // 確保錨點不小於 0
        }
    });

    console.log(`game ${game._id} summrization is: ${newSummary}`);

    console.log(`game ${game._id} summrization success. New anchor is at index ${newAnchorIndex}`)
    return;
}

export default {
    triggerSummarization,
};