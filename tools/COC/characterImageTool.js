// Import the socket.io instance for real-time communication with clients.
import { io } from "../../app.js";
// Import the Google Cloud Storage client.
import { Storage } from "@google-cloud/storage";
// Import necessary types and the main AI client from the Google Generative AI library.
import { Type, GoogleGenAI } from "@google/genai";

// Import the Mongoose model for a Character, used to update the database.
import Character from "../../models/COCCharacterModel.js";

let config = {};

// Check if GCP credentials are provided as a JSON string in environment variables.
if (process.env.GCP_CREDENTIALS_JSON) {
  try {
    config.credentials = JSON.parse(process.env.GCP_CREDENTIALS_JSON);
  } catch (e) {
    console.error("Error parsing GCP credentials JSON:", e);
  }
}

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API })

// Initialize the Google Cloud Storage client.
const storage = new Storage(config);
// Get a reference to the specific GCS bucket for character images.
const bucket = storage.bucket("my-trpg-character-images");


/**
 * A tool function for Gemini to generate a character avatar, upload it to GCS,
 * and link it to the character document in the database.
 * @param {object} params - Parameters for image generation.
 * @returns {object} A result object for the Gemini model.
 */
const generateCharacterImage = async ({ imagePrompt, characterId, gameId, userId }) => {
    // 1. Validate the input prompt to ensure it is not empty.
    if (!imagePrompt || imagePrompt.trim() === "") {
        console.error("Error ⚠️: fail to generate an image: empty prompt");
        return { toolResult: {
            result: "error",
            error: "Failed to generate image due to empty prompt",
        }};
    }

    // 2. Send a "pending" or "in-progress" message to the clients via socket.io.
    const systemMessageContent = `generateCharacterImage: ${imagePrompt})`;
    io.to(gameId).emit("systemMessage:received", { message: systemMessageContent, followMessage: "Gemini is drawing now...🖌️"});

    try {
        console.log(`[Image Gen] [Character: ${characterId}] - Starting generation...`);

        // Use the pre-initialized client to call the image generation API.
        const response = await genAI.models.generateImages({
            model: "imagen-4.0-generate-001", // imagen-4
            prompt: imagePrompt,
            config: {
                numberOfImages: 1,
            },
        })

        // Although an array is initialized, the loop will only run once and return.
        const imageUrls = [];

        for (const generatedImage of response.generatedImages) {
            // Get the Base64 encoded image data.
            const imgBtypes = generatedImage.image.imageBytes;

            // Convert the Base64 string into a Buffer.
            const buffer = Buffer.from(imgBtypes, "base64");
            const fileName = `characters/${gameId}-${Date.now()}.png`

            const file = bucket.file(fileName);

            console.log(`[Image Gen] 準備上傳圖片到 GCS: ${fileName}`);

            // Asynchronously upload the file buffer to GCS using a stream.
            await new Promise((resolve, reject) => {
                const stream = file.createWriteStream({
                    metadata: { contentType: "image/png" },
                    resumable: false,
                });
                stream.on("finish", resolve);
                stream.on("error", reject);
                stream.end(buffer);
            })

            // Construct the public URL for the uploaded image.
            const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
            imageUrls.push(imageUrl);
            console.log(`[Image Gen] 圖片上傳成功. URL: ${imageUrl}`);

            // 6. Update the character document in the database with the new image URL.
            await Character.findByIdAndUpdate(characterId, {
                $set: { imageUrl }
            });
            console.log(`[Image Gen] Character ${characterId} image URL updated in database.`);

            // 7. Prepare and send a success message to the clients.
            const successMessageContent = `Success to generate an avatar of your character！\n![character avatar](${imageUrl})`;
            io.to(gameId).emit("systemMessage:received", { message: successMessageContent , followingMessage: "Gemini love and think how to introduce it own drawing......"});

            
            // Send a specific, dedicated event for easier UI updates on the client side.
            io.to(gameId).emit("characterImage:updated", {
                characterId: characterId,
                imageUrl: imageUrl,
            });

            // ======================================================================

            return { toolResult: {
                result: "success",
                imageUrl: imageUrl, // 在 toolResult 中也回傳 URL
                },
                functionMessage: successMessageContent,
            };
        }
        
    } catch (error) {
        console.error("Error ⚠️: fail to generate an image: ", error.response ? error.response.data : error.message);

        return { toolResult: {
            result: "error",
            error: "Failed to generate image due to an internal API error or quota issue.",
            details: error.message,
        }};
    }
}

// This is the schema definition for the 'generateCharacterImage' tool.
// It tells the Gemini model what the function does and what parameters it needs.
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