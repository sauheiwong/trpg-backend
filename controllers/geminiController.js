import { GoogleGenerativeAI } from "@google/generative-ai"
import dotenv from "dotenv";
dotenv.config();

import gameHandlers from "../handlers/gameHandlers.js";
import messageHandlers from "../handlers/messageHandlers.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API)

const userLanguage = "繁體中文"

const startPrompt = `你好，KP。我準備好開始一場新的冒險了，請引導我。`

const systemPrompt = `
    你是專業克蘇魯的呼喚trpg的KP。你的任務是引導玩家完成一次充滿未
      知、恐怖和瘋狂的冒險。
    **開場**：首先，你需要主動向玩家提問，以確定劇本的基礎設定，例
      如：時代背景、故事發生的地點、玩家的角色概念、劇本的恐怖類型（
      如宇宙恐怖、心理恐怖、血腥等）。
    **氛圍營造**：克蘇魯神話的核心是未知。在劇情描述中，絕對不要直
      接說出神話生物或舊日支配者的名字。要用側面描寫、環境暗示和令人
      不安的細節來營造恐怖和懸疑的氣氛。
   **角色控制**：你絕對不能代替玩家控制他們所扮演的角色（PC
      ）。玩家的行動、思想和決定完全由他們自己掌握。
   **NPC控制**：與此同時，遊戲世界中所有的非玩家角色（NPC
      ）都由你來控制。你需要根據他們的性格和動機，對玩家的行動做出合
      情合理的回應。
   **語言**：請使用${userLanguage}進行所有對話。
                    `

const chatWithGeminiNew = async(req, res) => {
    const userId = req.user._id;
    try{
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: systemPrompt,
        });

        const chat = model.startChat({
            history: []
        })

        const result = await chat.sendMessage(startPrompt)
        const modelResponseText = result.response.text();

        console.log("Model Response Text: ", modelResponseText);

        const game = await gameHandlers.createGame(userId);

        await messageHandlers.createMessage(startPrompt, 'user', game._id, userId)

        await messageHandlers.createMessage(modelResponseText, 'model', game._id, userId)

        return res.status(200).send({message: modelResponseText, gameId: game._id})
    } catch (error) {
        console.error("Error ⚠️: fail to call Gemini API: ", error)
        return res.status(500).send({message: "fail to get response from AI, please try later"})
    }
    
}

const chatWithGeminiById = async(req, res) => {
    const gameId = req.params.id;
    const userId = req.user._id;
    const userMessage = req.body.message;

    if(!userMessage || userMessage.length === 0){
        return res.status(400).send({message: "please provide your message"})
    }

    const { messages } = await gameHandlers.getGameById(gameId, userId)

    const processedMessage = messages.map((message) => {
        return {
            role: message.role,
            parts: [{ text: message.content }]
        }
    })

    try{
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            config: {
                systemInstruction: systemPrompt
            }
        });

        const chat = model.startChat({
            history: processedMessage
        })

        const result = await chat.sendMessage(userMessage);

        const modelResponseText = result.response.text();

        console.log("Model Response Text: ", modelResponseText);

        await messageHandlers.createMessage(userMessage, "user", gameId, userId);

        await messageHandlers.createMessage(modelResponseText, "model", gameId, userId);

        return res.status(200).send({message: modelResponseText})
    } catch (error) {
        console.error("Error ⚠️: fail to call Gemini API: ", error)
        return res.status(500).send({message: "fail to get response from AI, please try later"})
    }
    
}

export default {
    chatWithGeminiNew,
    chatWithGeminiById,
}
