import { io } from "../../app.js";
import { Storage } from "@google-cloud/storage";
import { VertexAI } from "@google-cloud/vertexai";

import Character from "../../models/COCCharacterModel.js";
import messageHandlers from "../../handlers/messageHandlers.js";

const vertex_ai = new VertexAI({
    project: "gen-lang-client-0478463521",
    location: "us-central1"
})
const generativeModel = vertex_ai.getGenerativeModel({
    model: "imagen-3.0-fast-generate-001",
})

const storage = new Storage({ projectId: "gen-lang-client-0478463521" });
const bucket = storage.bucket("my-trpg-character-images");

const generateCharacterImage = async({ imagePrompt, characterId, gameId }) => {
    if (!imagePrompt || imagePrompt.trim() === "") {
        console.error("Error ⚠️: fail to generate an image: empty prompt");
        return { result: "fail" }
    }

    try {
        console.log(`[Image Gen] got an image generation request of character ${characterId}`);
        
        // --- 修正部分 START ---

        // 1. 準備新的請求 (Request) 格式
        const request = {
            contents: [
                {
                    parts: [{ text: imagePrompt }]
                }
            ],
        };

        // 2. 呼叫新的函式 generateContentStream
        const responseStream = await generativeModel.generateContentStream(request);
        
        // 3. 從 Stream 中解析回傳的 Response
        const aggregatedResponse = await responseStream.response;

        // 4. 從新的 Response 結構中提取圖片資料
        const firstCandidate = aggregatedResponse.candidates?.[0];
        if (!firstCandidate || !firstCandidate.content.parts?.[0] || firstCandidate.content.parts[0].mimeType !== 'image/png') {
            // 如果 API 沒有回傳預期的圖片格式，拋出錯誤
            console.error("Error ⚠️: API response did not contain a valid image.", JSON.stringify(aggregatedResponse));
            throw new Error('API did not return a valid image.');
        }

        const imageBase64 = firstCandidate.content.parts[0].inlineData.data;

        // --- 修正部分 END ---

        console.log(`[Image Gen] image generation success`);

        const imageBuffer = Buffer.from(imageBase64, "base64");
        const fileName = `characters/${characterId}-${Date.now()}.png`;
        const file = bucket.file(fileName);

        await file.save(imageBuffer, {
            metadata: {
                contentType: "image/png",
            }
        });
        console.log(`[Image Gen] image has been sent to GCS: ${fileName}`);

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        await Character.findByIdAndUpdate(characterId, { imageUrl: publicUrl });
        console.log(`[Image Gen] character ${characterId} data has been edited in DB.`);

        const payload = {
            characterId,
            ImageUrl: publicUrl,
        };
        io.to(gameId).emit("characterImageUpdated", payload);
        console.log(`[Image Gen] character image has been sent to game room ${gameId}`);

        return { toolResult: {
            result: "success",
            imageUrl: imageUrl, // 在 toolResult 中也回傳 URL
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
const generateCharacterImageDeclaration = {
    name: "generateCharacterImage",
    description: "生成角色形象圖。當玩家想要為某個角色創建一張視覺圖片時使用。",
    parameters: {
        type: "object",
        properties: {
            imagePrompt: {
                type: "string", // Gemini API 中 STRING 通常是大寫
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