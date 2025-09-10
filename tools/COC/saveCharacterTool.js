import { io } from "../../app.js";
import { Type } from "@google/genai";

import COCCharacter from "../../models/COCCharacterModel.js";
import gameModel from "../../models/gameModel.js";

const saveCharacterStatus = async (infor) => {

  console.log("infor is: ", JSON.stringify(infor));

  const attributesMap = new Map(
    infor.attributes.map((attr) => [attr.name, attr.value])
  );
  const skillsMap = new Map(
    infor.skills.map((skill) => [skill.name, skill.value])
  );

  const characterData = {
    ...infor,
    attributes: attributesMap,
    skills: skillsMap,
    isCompleted: true,
  };
  const newCharacter = await COCCharacter.create(characterData);
  console.log("new character is: ", newCharacter);

  await gameModel.findByIdAndUpdate(infor.gameId, {
    characterId: newCharacter._id,
  });

  io.to(infor.gameId).emit("systemMessage:received", { message: "save character success", followingMessage: "Gemini got the result and thinking..." })

  return { toolResult : {
    result: "success",
    character: newCharacter,
    message: "please ask player 'do they want to generate an avatar of their character?'"
  } };
};

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
            equipped: {
              type: "boolean",
              description: "是否已經裝備，預設為false",
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
