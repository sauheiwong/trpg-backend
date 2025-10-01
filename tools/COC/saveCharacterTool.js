// Import the socket.io instance for real-time communication.
import { io } from "../../app.js";
// Import the 'Type' enum for defining the tool's parameter schema.
import { Type } from "@google/genai";

// Import Mongoose models for interacting with the database.
import COCCharacter from "../../models/COCCharacterModel.js";
import gameModel from "../../models/gameModel.js";

/**
 * A tool function for Gemini to save a completed character sheet to the database.
 * @param {object} infor - An object containing all character information.
 * @returns {object} A result object for the Gemini model.
 */
const saveCharacterStatus = async (infor) => {

  try{

    console.log("infor is: ", JSON.stringify(infor));

    // Convert the attributes array (e.g., [{name: 'STR', value: 50}]) into a JavaScript Map.
    // This is a flexible way to store key-value pairs, especially if the Mongoose schema is defined to handle Maps.
    const attributesMap = new Map(
      infor.attributes.map((attr) => [attr.name, attr.value])
    );
    // Convert the skills array into a Map as well.
    const skillsMap = new Map(
      infor.skills.map((skill) => [skill.name, skill.value])
    );

    // Prepare the complete character data object for database creation.
    const characterData = {
      ...infor,
      attributes: attributesMap,
      skills: skillsMap,
      isCompleted: true,
    };

    // Create a new character document in the database using the COCCharacter model.
    const newCharacter = await COCCharacter.create(characterData);
    console.log("new character is: ", newCharacter);

    // Link the newly created character to the current game session.
    // This updates the game document to hold a reference to the new character's ID.
    await gameModel.findByIdAndUpdate(infor.gameId, {
      characterId: newCharacter._id,
    });

    // Notify all clients in the game room that the character has been saved successfully.
    io.to(infor.gameId).emit("systemMessage:received", { message: "save character success", followingMessage: "Gemini got the result and thinking..." })

    io.to(infor.gameId).emit("newCharacter:received", { newCharacter })

    // Return a structured result to the Gemini model.
    return { toolResult : {
      result: "success",
      character: newCharacter,
      message: "please ask player 'do they want to generate an avatar of their character?'"
      },
      functionMessage: "save character success"
    };

  } catch (error) {
    console.error("Error saving character:", error)
    return {
      toolResult: {
        result: "error",
        message: "Failed to save the character due to a database error.",
        errorDetails: error.message
      }
    };
  }
};

// This is the schema definition for the 'saveCharacterStatus' tool.
// It provides a detailed structure for the AI to follow when calling this function.
const saveCharacterStatusDeclaration = {
  name: "saveCharacterStatus",
  description: "當玩家完成克蘇魯的呼喚trpg的角色並要求將其新角色儲存時使用",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: "角色的名字",
      },
      class: {
        type: Type.STRING,
        description: "角色的職業",
      },
      hp: {
        type: Type.OBJECT,
        description: "角色的血量(HP),包含上限和當前值",
        properties: {
          max: {
            type: Type.NUMBER,
            description: "HP上限",
          },
          current: {
            type: Type.NUMBER,
            description: "當前HP",
          },
        },
        required: ["max", "current"],
      },
      mp: {
        type: Type.OBJECT,
        description: "角色的魔法力(MP),包含上限和當前值",
        properties: {
          max: {
            type: Type.NUMBER,
            description: "MP上限",
          },
          current: {
            type: Type.NUMBER,
            description: "當前MP",
          },
        },
        required: ["max", "current"],
      },
      san: {
        type: Type.NUMBER,
        description: "角色的SAN值"
      },
      attributes: {
        type: Type.ARRAY,
        description:
          "角色的屬性列表。每個屬性都是一個包含 'name' 和 'value' 的物件。",
        items: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "屬性的名稱，例如 '力量(STR)' 或 '敏捷(DEX)'",
            },
            value: {
              type: Type.NUMBER,
              description: "屬性的數值",
            },
          },
          required: ["name", "value"],
        },
      },
      skills: {
        type: Type.ARRAY,
        description:
          "角色的技能列表。每個技能都是一個包含 'name' 和 'value' 的物件。",
        items: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "技能的名稱，例如 '偵查' 或 '說服'",
            },
            value: {
              type: Type.NUMBER,
              description: "技能的數值",
            },
          },
          required: ["name", "value"],
        },
      },
      equipment: {
        type: Type.ARRAY,
        description: "角色的裝備列表，每個裝備都是一個物件。",
        items: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "裝備的名稱",
            },
            quantity: {
              type: Type.NUMBER,
              description: "裝備的數量，預設為1",
            },
            damage: {
              type: Type.STRING,
              description: "裝備造成的傷害，例如: '1d4', '2d6+1'",
            },
            description: {
              type: Type.STRING,
              description: "裝備的文字描述",
            },
          },
          required: ["name"],
        },
      },
      description: {
        type: Type.STRING,
        description: "角色的描述，例如: 性格、目標、重要朋友、重要經歷等等。",
      },
    },
    required: [
      "name",
      "class",
      "hp",
      "mp",
      "san",
      "attributes",
      "skills",
      "description",
    ],
  },
};

export default {
  saveCharacterStatus,
  saveCharacterStatusDeclaration,
};
