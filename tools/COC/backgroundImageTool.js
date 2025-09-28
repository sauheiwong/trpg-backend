// Import the socket.io instance for real-time communication with clients.
import { io } from "../../app.js";
// Import the Google Cloud Storage client.
import { Storage } from "@google-cloud/storage";
// Import necessary types and the main AI client from the Google Generative AI library.
import { Type, GoogleGenAI } from "@google/genai";

// Import the Mongoose model for the game, used to interact with the database.
import COCGame from "../../models/gameModel.js";

let config = {};

// Check if GCP credentials are provided as a JSON string in environment variables.
// This is a common practice for environments like Docker or cloud platforms.
if (process.env.GCP_CREDENTIALS_JSON) {
  try {
    config.credentials = JSON.parse(process.env.GCP_CREDENTIALS_JSON);
  } catch (e) {
    console.error("Error parsing GCP credentials JSON:", e);
  }
}

// Initialize the GoogleGenAI client to use the Imagen model.
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API })

// Initialize the Google Cloud Storage client with the provided configuration.
const storage = new Storage(config);
// Get a reference to a specific GCS bucket where images will be stored.
const bucket = storage.bucket("my-trpg-background-images");


/**
 * A tool function for Gemini to generate a background image using Imagen,
 * upload it to Google Cloud Storage, and update the game state.
 * @param {object} params - The parameters for image generation.
 * @returns {object} An object containing the result to be returned to the Gemini model.
 */
const generateBackgroundImage = async ({ name, imagePrompt, gameId }) => {
    // 1. Validate the input prompt to ensure it's not empty.
    if (!imagePrompt || imagePrompt.trim() === "") {
        console.error("Error ⚠️: fail to generate an image: empty prompt");
        return { toolResult: {
            result: "error",
            error: "Failed to generate image due to empty prompt",
        }};
    }

    // Check if an image with the same name already exists in the database for caching purposes.
    const game = await COCGame.findById(gameId);
    if (!game) {
        console.error("Error ⚠️: Game not found");
        return { toolResult: {
            result: "error",
            error: "Game not found",
        }};
    }

    // Access the backgroundImages map on the game object to find an existing URL.
    const existingImageUrl = game.backgroundImages?.[name];
    if (existingImageUrl) {
        // If an image already exists, reuse it to save API costs and time.
        console.log(`[Image Gen] Existing image found for ${name}: ${existingImageUrl}`);
        const reuseMessageContent = `Reusing existing background image for ${name}.`;
        // Notify all clients in the game room about the reused image.
        io.to(gameId).emit("systemMessage:received", { message: reuseMessageContent });
        // Send a specific event for the UI to update the background image directly.
        io.to(gameId).emit("backgroundImage:updated", { imageUrl: existingImageUrl });

        return { toolResult: {
            result: "success",
            imageUrl: existingImageUrl,
            message: "background image has been changed."
            },
            functionMessage: reuseMessageContent
        };
    }

    // 2. If no existing image is found, proceed with generation.
    // Notify clients that the image generation process has started.
    const systemMessageContent = `generateBackgroundImage: ${imagePrompt}`;
    io.to(gameId).emit("systemMessage:received", { message: systemMessageContent, followingMessage: "Gemini is drawing now...🖌️" });

    try {
        console.log(`[Image Gen] [COC GameId: ${gameId}] - Starting generation...`);

        // Call the image generation API.
        const response = await genAI.models.generateImages({
            model: "imagen-4.0-generate-001", // Specify the Imagen model
            prompt: imagePrompt,
            config: {
                numberOfImages: 1, // We only need one image.
            },
        })
        
        // An array to hold the URLs of the generated images.
        const imageUrls = [];

        // Loop through the array of generated images (even though we only expect one).
        for (const generatedImage of response.generatedImages) {
            // Get the raw image data, which is Base64 encoded.
            const imgBytes = generatedImage.image.imageBytes;

            // Convert the Base64 string into a Buffer for uploading.
            const buffer = Buffer.from(imgBytes, "base64");
            // Create a unique filename using the game ID and a timestamp.
            const fileName = `background/${gameId}-${Date.now()}.png`

            // Get a reference to the file object in the GCS bucket.
            const file = bucket.file(fileName);

            console.log(`[Image Gen] 準備上傳圖片到 GCS: ${fileName}`);

            // Asynchronously upload the file buffer to GCS using a stream.
            // We wrap this in a Promise to use async/await syntax.
            await new Promise((resolve, reject) => {
                const stream = file.createWriteStream({
                    metadata: { contentType: "image/png" },
                    resumable: false,
                });
                stream.on("finish", resolve);
                stream.on("error", reject);
                stream.end(buffer);
            })

            // Construct the public URL for the newly uploaded image.
            const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
            imageUrls.push(imageUrl);
            console.log(`[Image Gen] 圖片上傳成功. URL: ${imageUrl}`);

            // Update the game document in the database with the new image URL.
            await COCGame.findByIdAndUpdate(gameId, {
                $set: {
                    // Use a computed property name to update the specific key in the backgroundImages map.
                    [`backgroundImages.${name}`]: imageUrl,
                    // Also update the current background image to the new one.
                    ["currentBackgroundImage"]: imageUrl,
                }
            })

            // 7. Prepare a success message with the image embedded in Markdown format.
            const successMessageContent = `Success to generate a background image!\n![background](${imageUrl})`;
            
            io.to(gameId).emit("systemMessage:received", { message: successMessageContent , followingMessage: "Gemini love and think how to introduce it own drawing..."});
            
            // Send a dedicated event for the UI to easily update the background.
            io.to(gameId).emit("backgroundImage:updated", {
                imageUrl: imageUrl,
            });

            // Return a successful result to the Gemini model.
            return { toolResult: {
                result: "success",
                imageUrl: imageUrls, // Return the URL in the tool result.
                message: "new background image has been generated."
                },
                functionMessage: successMessageContent
            };
        }
        
    } catch (error) {
        console.error("Error ⚠️: fail to generate an image: ", error.response ? error.response.data : error.message);

        // Return a detailed error object to the Gemini model.
        return { toolResult: {
            result: "error",
            error: "Failed to generate image due to an internal API error or quota issue.",
            details: error.message,
        }};
    }
}

// This is the schema definition for the 'generateBackgroundImage' tool.
// It tells the Gemini model what the function does and what parameters it needs.
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