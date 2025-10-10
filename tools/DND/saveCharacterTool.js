// backend/tools/DND/saveCharacterTool.js

import DNDCharacter from "../../models/DNDCharacterModel.js";
import DNDGameModel from "../../models/DNDGameModel.js";
import gameModel from "../../models/DNDGameModel.js";

// 這是在後端執行的函式
const saveDNDCharacter = async (infor) => {
  console.log("Saving D&D character info: ", JSON.stringify(infor));

  // Gemini 可能只會給我們屬性分數，我們需要自己計算調整值
  const attributes = new Map();
  for (const attr of infor.attributes) {
    const modifier = Math.floor((attr.score - 10) / 2);
    attributes.set(attr.name, { score: attr.score, modifier: modifier });
  }

  // 將熟練的技能轉換為 Map
  const skills = new Map();
  infor.proficientSkills.forEach((skillName) => {
    skills.set(skillName, { proficient: true });
  });

  // 將熟練的豁免轉換為 Map
  const savingThrows = new Map();
  infor.proficientSavingThrows.forEach((saveName) => {
    savingThrows.set(saveName, { proficient: true });
  });

  const characterData = {
    ...infor,
    attributes,
    skills,
    savingThrows,
    isCompleted: true,
  };

  const newCharacter = await DNDCharacter.create(characterData);
  console.log("New D&D character created: ", newCharacter);

  await gameModel.findByIdAndUpdate(infor.chatId, {
    characterId: newCharacter._id,
  });

  return "D&D character saved successfully.";
};

// 這是給 Gemini 看的工具定義
const saveDNDCharacterDeclaration = {
  name: "saveDNDCharacter",
  description: "當玩家完成龍與地下城(D&D 5e)角色創建並要求儲存時使用此工具。",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", description: "角色的名字" },
      race: {
        type: "string",
        description: "角色的種族，例如 '人類' 或 '精靈'",
      },
      characterClass: {
        type: "string",
        description: "角色的職業，例如 '戰士' 或 '法師'",
      },
      level: { type: "number", description: "角色的等級，初始為 1" },
      background: {
        type: "string",
        description: "角色的背景，例如 '學者' 或 '士兵'",
      },
      alignment: {
        type: "string",
        description: "角色的陣營，例如 '混亂善良' 或 '守序中立'",
      },
      hp: {
        type: "object",
        properties: {
          max: { type: "number", description: "HP 上限" },
          current: { type: "number", description: "當前 HP" },
        },
        required: ["max", "current"],
      },
      armorClass: { type: "number", description: "角色的護甲等級 (AC)" },
      speed: { type: "number", description: "角色的速度 (單位為英尺)" },
      proficiencyBonus: { type: "number", description: "角色的熟練加值" },
      attributes: {
        type: "array",
        description: "角色的六大屬性列表，包含名稱和最終分數。",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "屬性名稱 (力量, 敏捷, 體質, 智力, 感知, 魅力)",
            },
            score: { type: "number", description: "屬性的分數 (3-20)" },
          },
          required: ["name", "score"],
        },
      },
      proficientSavingThrows: {
        type: "array",
        description: "角色所熟練的豁免檢定列表。",
        items: {
          type: "string",
          description: "豁免檢定的屬性名稱 (例如 '體質')",
        },
      },
      proficientSkills: {
        type: "array",
        description: "角色所熟練的技能列表。",
        items: {
          type: "string",
          description: "技能名稱 (例如 '運動' 或 '奧秘')",
        },
      },
      equipment: {
        type: "array",
        description: "角色的裝備列表。",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "裝備名稱" },
            quantity: { type: "number", description: "數量" },
          },
          required: ["name"],
        },
      },
      description: {
        type: "string",
        description: "角色的背景故事、外觀、性格等描述。",
      },
    },
    required: [
      "name",
      "race",
      "class",
      "level",
      "hp",
      "armorClass",
      "speed",
      "proficiencyBonus",
      "attributes",
      "proficientSavingThrows",
      "proficientSkills",
    ],
  },
};

export default {
  saveDNDCharacter,
  saveDNDCharacterDeclaration,
};
