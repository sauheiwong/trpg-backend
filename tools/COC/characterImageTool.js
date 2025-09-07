import { io } from "../../app.js";
import { Storage } from "@google-cloud/storage";
import { Type, GoogleGenAI } from "@google/genai";

import Character from "../../models/COCCharacterModel.js";
import messageHandlers from "../../handlers/messageHandlers.js";

// 初始化 Google Cloud Storage
const storage = new Storage({ projectId: "gen-lang-client-0478463521" });
const bucket = storage.bucket("my-trpg-character-images");

const generateCharacterImage = async ({ imagePrompt, characterId, gameId, userId }) => {
    // 1. 檢查提示詞是否為空
    if (!imagePrompt || imagePrompt.trim() === "") {
        console.error("Error ⚠️: fail to generate an image: empty prompt");
        return { toolResult: {
            result: "error",
            error: "Failed to generate image due to empty prompt",
        }};
    }

    // 2. 建立並發送 "生成中..." 的系統訊息
    const systemMessageContent = `Generating Image. Please wait (Prompt: ${imagePrompt})`;
    const pendingMessage = await messageHandlers.createMessage(systemMessageContent, "system", gameId, userId);
    io.to(gameId).emit("systemMessage:received", { message: systemMessageContent, followMessage: "Gemini is drawing now...🖌️"});

    try {
        console.log(`[Image Gen] [Character: ${characterId}] - Starting generation...`);

        // Imagen model generate images
        const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API })
        const response = await genAI.models.generateImages({
            model: "imagen-4.0-generate-001", // imagen-4
            prompt: imagePrompt,
            config: {
                numberOfImages: 1,
            },
        })

        const imageUrls = [];

        for (const generatedImage of response.generatedImages) {
            const imgBtypes = generatedImage.image.imageBytes;

            const buffer = Buffer.from(imgBtypes, "base64");
            const fileName = `background/${gameId}-${Date.now()}.png`

            const file = bucket.file(fileName);

            console.log(`[Image Gen] 準備上傳圖片到 GCS: ${fileName}`);

            // async upload
            await new Promise((resolve, reject) => {
                const stream = file.createWriteStream({
                    metadata: { contentType: "image/png" },
                    resumable: false,
                });
                stream.on("finish", resolve);
                stream.on("error", reject);
                stream.end(buffer);
            })

            const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
            imageUrls.push(imageUrl);
            console.log(`[Image Gen] 圖片上傳成功. URL: ${imageUrl}`);

            // 6. 更新資料庫中的角色圖片 URL
            await Character.findByIdAndUpdate(characterId, {
                $set: { imageUrl }
            });
            console.log(`[Image Gen] Character ${characterId} image URL updated in database.`);

            // 7. 更新系統訊息，並通知前端
            const successMessageContent = `成功生成角色圖片！\n![角色圖片](${imageUrl})`;
            await messageHandlers.createMessage(successMessageContent, "system", gameId, userId);
            
            // 發送更新後的訊息物件到前端
            io.to(gameId).emit("systemMessage:received", { message: successMessageContent , followingMessage: "Gemini love and think how to introduce it own drawing......"});

            
            // 額外發送一個特定事件，方便前端直接更新角色卡等 UI 元件
            io.to(gameId).emit("characterImage:updated", {
                characterId: characterId,
                imageUrl: imageUrl,
            });

            // ======================================================================

            return { toolResult: {
                result: "success",
                imageUrl: imageUrl, // 在 toolResult 中也回傳 URL
            }};
        }
        
    } catch (error) {
        console.error("Error ⚠️: fail to generate an image: ", error.response ? error.response.data : error.message);
        
        // 如果生成失敗，刪除 "生成中..." 的訊息
        await messageHandlers.deleteMessage(pendingMessage._id);
        io.to(gameId).emit("message:deleted", { messageId: pendingMessage._id });

        return { toolResult: {
            result: "error",
            error: "Failed to generate image due to an internal API error or quota issue.",
            details: error.message,
        }};
    }
}

// 函式聲明保持不變
const generateCharacterImageDeclaration = {
    name: "generateCharacterImage",
    description: "生成角色形象圖。當玩家想要為某個角色創建一張視覺圖片時使用。",
    parameters: {
        type: Type.OBJECT,
        properties: {
            imagePrompt: {
                type: Type.STRING,
                description: "用於生成角色形象圖的詳細英文描述，例如 'A young female detective with short black hair, wearing a trench coat, standing on a rainy street in the 1920s, film noir style.'"
            }
        },
        required: ["imagePrompt"]
    }
};

export default {
    generateCharacterImage,
    generateCharacterImageDeclaration,
}