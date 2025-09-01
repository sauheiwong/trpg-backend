import { io } from "../../app.js";
import { Storage } from "@google-cloud/storage";
import axios from "axios"; // 引入 axios

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
    const systemMessageContent = `Generating Image. Please wait (Prompt: ${imagePrompt})`;
    const pendingMessage = await messageHandlers.createMessage(systemMessageContent, "system", gameId, userId);
    io.to(gameId).emit("systemMessage:received", { message: systemMessageContent });

    try {
        console.log(`[Image Gen] [COC GameId: ${gameId}] - Starting generation...`);

        // ==================== 新增的 Stable Diffusion 邏輯 ====================

        // 3. 呼叫 Stability AI API
        const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
        const engineId = 'stable-diffusion-xl-1024-v1-0'; // 建議使用較新的 SDXL 模型

        if (!STABILITY_API_KEY) {
            throw new Error("Missing Stability AI API key in environment variables.");
        }
        
        // 增強提示詞，以獲得更好的角色圖片效果
        const enhancedPrompt = `${imagePrompt}, intricate details, high quality`;
        const negativePrompt = 'blurry, bad art, ugly, deformed, worst quality, low quality';

        const response = await axios.post(
            `https://api.stability.ai/v1/generation/${engineId}/text-to-image`,
            {
                text_prompts: [
                    { text: enhancedPrompt, weight: 1 },
                    { text: negativePrompt, weight: -1 }
                ],
                cfg_scale: 7,
                height: 1024,
                width: 1024,
                steps: 30,
                samples: 1,
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            }
        );

        const imageArtifact = response.data.artifacts[0];
        if (!imageArtifact) {
            throw new Error('No image artifact returned from Stability AI API.');
        }

        // 4. 將 Base64 圖片數據轉換為 Buffer
        const buffer = Buffer.from(imageArtifact.base64, 'base64');
        const fileName = `background/${gameId}-${Date.now()}.png`;
        
        // 5. 上傳圖片到 Google Cloud Storage
        console.log(`[Image Gen] Uploading image to GCS at ${fileName}`);
        const file = bucket.file(fileName);
        
        await new Promise((resolve, reject) => {
            const stream = file.createWriteStream({
                metadata: { contentType: 'image/png' },
                resumable: false,
            });
            stream.on('finish', resolve);
            stream.on('error', (err) => reject(err));
            stream.end(buffer);
        });
        
        const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        console.log(`[Image Gen] Image successfully uploaded. URL: ${imageUrl}`);

        // 6. 更新資料庫中的背景圖片 URL
        await COCGame.findByIdAndUpdate(gameId, {
            $set: { [`backgroundImages.${name}`]: imageUrl }
        });
        console.log(`[Image Gen] game ${gameId} image URL updated in database.`);

        // 7. 更新系統訊息，並通知前端
        const successMessageContent = `Success to generate a background image ！)`;
        await messageHandlers.createMessage(successMessageContent, "system", gameId, userId);
        
        // 發送更新後的訊息物件到前端
        io.to(gameId).emit("systemMessage:received", { message: successMessageContent});
        
        // 額外發送一個特定事件，方便前端直接更新角色卡等 UI 元件
        io.to(gameId).emit("backgroundImage:updated", {
            imageUrl: imageUrl,
        });

        // ======================================================================

        return { toolResult: {
            result: "success",
            imageUrl: imageUrl, // 在 toolResult 中也回傳 URL
            message: "new background image has been generated."
        }};
        
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
const generateBackgroundImageDeclaration = {
    name: "generateBackgroundImage",
    description: "生成場景背景圖。當劇情轉換場景時使用。",
    parameters: {
        type: "object",
        properties: {
            imagePrompt: {
                type: "string", // Gemini API 中 STRING 通常是大寫
                description: "用於生成場景背景圖的詳細英文描述。"
            },
            name: {
                type: "string",
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