import { io } from "../../app.js";
import { Storage } from "@google-cloud/storage";
import { Type, GoogleGenAI } from "@google/genai";

import COCGame from "../../models/gameModel.js";
import messageHandlers from "../../handlers/messageHandlers.js";

// 初始化 Google Cloud Storage
const storage = new Storage({ projectId: "gen-lang-client-0478463521" });
const bucket = storage.bucket("my-trpg-background-images");

const generateBackgroundImage = async ({ name, imagePrompt, gameId, userId }) => {
    // 1. 檢查提示詞是否為空
    if (!imagePrompt || imagePrompt.trim() === "") {
        console.error("Error ⚠️: fail to generate an image: empty prompt");
        return { toolResult: {
            result: "error",
            error: "Failed to generate image due to empty prompt",
        }};
    }

    // check existing image
    const game = await COCGame.findById(gameId);
    if (!game) {
        console.error("Error ⚠️: Game not found");
        return { toolResult: {
            result: "error",
            error: "Game not found",
        }};
    }

    const existingImageUrl = game.backgroundImages?.[name];
    if (existingImageUrl) {
        // 如果已存在，直接返回現有 URL，並發送系統訊息
        console.log(`[Image Gen] Existing image found for ${name}: ${existingImageUrl}`);
        const reuseMessageContent = `Reusing existing background image for ${name}.`;
        await messageHandlers.createMessage(reuseMessageContent, "system", gameId, userId);
        io.to(gameId).emit("systemMessage:received", { message: reuseMessageContent });
        io.to(gameId).emit("backgroundImage:updated", { imageUrl: existingImageUrl });

        return { toolResult: {
            result: "success",
            imageUrl: existingImageUrl,
            message: "background image has been changed."
        }};
    }

    // 2. 建立並發送 "生成中..." 的系統訊息
    const systemMessageContent = `Generating Image. Please wait \n (Prompt: ${imagePrompt})`;
    const pendingMessage = await messageHandlers.createMessage(systemMessageContent, "system", gameId, userId);
    io.to(gameId).emit("systemMessage:received", { message: systemMessageContent, followingMessage: "Gemini is drawing now...🖌️" });

    try {
        console.log(`[Image Gen] [COC GameId: ${gameId}] - Starting generation...`);

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

            await COCGame.findByIdAndUpdate(gameId, {
                $set: {
                     [`backgroundImages.${name}`]: imageUrl,
                     ["currentBackgroundImage"]: imageUrl,
                }
            })

            // 7. 更新系統訊息，並通知前端
            const successMessageContent = `Success to generate a background image! \n ![background](${imageUrl})
            `;
            await messageHandlers.createMessage(successMessageContent, "system", gameId, userId);


            
            // 發送更新後的訊息物件到前端
            io.to(gameId).emit("systemMessage:received", { message: successMessageContent , followingMessage: "Gemini love and think how to introduce it own drawing..."});
            
            // 額外發送一個特定事件，方便前端直接更新角色卡等 UI 元件
            io.to(gameId).emit("backgroundImage:updated", {
                imageUrl: imageUrl,
            });

        }
        
        return { toolResult: {
            result: "success",
            imageUrl: imageUrls, // 在 toolResult 中也回傳 URL
            message: "new background image has been generated."
        }};
        
    } catch (error) {
        console.error("Error ⚠️: fail to generate an image: ", error.response ? error.response.data : error.message);
        
        // 如果生成失敗，刪除 "生成中..." 的訊息
        await messageHandlers.deleteMessage(pendingMessage._id);
        // io.to(gameId).emit("message:deleted", { messageId: pendingMessage._id });

        return { toolResult: {
            result: "error",
            error: "Failed to generate image due to an internal API error or quota issue.",
            details: error.message,
        }};
    }
}

// 函式聲明保持不變
const generateBackgroundImageDeclaration = {
    name: "generateBackgroundImage",
    description: "生成場景背景圖。當劇情轉換場景時自行使用。",
    parameters: {
        type: Type.OBJECT,
        properties: {
            imagePrompt: {
                type: Type.STRING, // Gemini API 中 STRING 通常是大寫
                description: "用於生成場景背景圖的詳細英文描述。"
            },
            name: {
                type: Type.STRING,
                description: "場景的英文名字，方便之後重用。"
            }
        },
        required: ["imagePrompt", "name"]
    }
};

export default {
    generateBackgroundImage,
    generateBackgroundImageDeclaration,
}