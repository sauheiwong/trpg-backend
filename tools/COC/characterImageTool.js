import { io } from "../../app.js";

import { VertexAI } from "@google-cloud/vertexai";
import { Storage } from "@google-cloud/storage";

import Character from "../../models/COCCharacterModel.js";
import messageHandlers from "../../handlers/messageHandlers.js";

const vertex_ai = new VertexAI({
    project: "gen-lang-client-0478463521",
    location: "us-central1"
})
const generativeModel = vertex_ai.preview.getGenerativeModel({
    model: "imagen-3.0-fast-generate-001", // the best one after testing
})

const storage = new Storage({ projectId: "gen-lang-client-0478463521" });
const bucket = storage.bucket("my-trpg-character-images");

const generateCharacterImage = async({ imagePrompt, characterId, gameId, userId }) => {
    if (!imagePrompt || imagePrompt.trim() === "") {
        console.error("Error ⚠️: fail to generate an image: empty prompt");
        return { toolResult: {
            result: "error",
            error: "Failed to generate image due empty prompt",
        } }
    }

    const systemMessage = `Send a request to generate an image. Please wait.`

    const newSystemMessage = await messageHandlers.createMessage(systemMessage, "system", gameId, userId)

    io.to(gameId).emit("systemMessage:received", { systemMessage })

    try {
        console.log(`[Image Gen] got an image generation request of character ${characterId}`);
        const request = {
            contents: [
                {
                    parts: [{ text: imagePrompt }]
                }
            ],
        };

        const responseStream = await generativeModel.generateContentStream(request);
        
        const aggregatedResponse = await responseStream.response;

        const firstCandidate = aggregatedResponse.candidates?.[0];
        if (!firstCandidate || !firstCandidate.content.parts?.[0] || firstCandidate.content.parts[0].mimeType !== 'image/png') {
            console.error("Error ⚠️: API response did not contain a valid image.", JSON.stringify(aggregatedResponse));
            throw new Error("API did not return a valid image.") ;
        }

        const imageBase64 = firstCandidate.content.parts[0].inlineData.data;
        console.log(`[Image Gen] image generation success`);

        const imageBuffer = Buffer.from(imageBase64, "base64");

        const fileName = `characters/${characterId}-${Date.now()}.png`;
        const file = bucket.file(fileName);

        await file.save(imageBuffer, {
            metadata: {
                contentType: "image/png",
            }
        })

        console.log(`[Image Gen] image has been sent to GCS: ${fileName}`);

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        await Character.findByIdAndUpdate(characterId, { imageUrl: publicUrl });
        console.log(`[Image Gen] character ${characterId} data has been edited in DB.`)

        const payload = {
            characterId,
            newImageUrl: publicUrl,
        }

        // io.to(gameId).emit("characterImageUpdated", payload);
        console.log(`[Image Gen] character image has been sent to game room ${gameId}`);

        return { toolResult: {
            result: "success",
        }, 
        messageId: newSystemMessage._id };
        
    } catch (error) {
        console.error("Error ⚠️: fail to generate an image: ", error);
        messageHandlers.deleteMessage(newSystemMessage._id);
        return { toolResult: {
            result: "error",
            error: "Failed to generate image due to an internal API error or quota issue.",
            details: error.message,
        }};
    }

}

const generateCharacterImageDeclaration = {
    name: "generateCharacterImage",
    description: "生成角色形象圖",
    parameters: {
        type: "object",
        properties: {
            imagePrompt: {
                type: "STRING",
                description: "生成角色形象圖的提示詞。"
            }
        },
        required: ["imagePrompt"]
    }
}

export default {
    generateCharacterImage,
    generateCharacterImageDeclaration,
}