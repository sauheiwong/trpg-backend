import { io } from "../../app.js";

import Character from "../../models/COCCharacterModel.js";

const updateCharacterStats = async ({ characterId, hp, mp, san, gameId, userId }) => {
  try {
    // 查詢角色
    const character = await Character.findById(characterId);
    if (!character) {
      throw new Error("character not found");
    }

    // 更新屬性，確保不超過最大值
    const updates = {};
    if (hp !== undefined) {
      updates.hp = { current: Math.min(Math.max(0, hp), character.hp.max || Number.MAX_SAFE_INTEGER), max: character.hp.max };
    }
    if (mp !== undefined) {
      updates.mp = { current: Math.min(Math.max(0, mp), character.mp.max || Number.MAX_SAFE_INTEGER), max: character.mp.max };
    }
    if (san !== undefined) {
      updates.san = Math.min(Math.max(0, san), 100); // SAN 通常上限為 100
    }

    // 保存更新
    Object.assign(character, updates);
    await character.save();

    // 建立系統訊息
    const message = `Character ${character.name} update: HP ${character.hp.current}/${character.hp.max}, MP ${character.mp.current}/${character.mp.max}, SAN ${character.san}`;
    // const newMessage = await messageHandlers.createMessage(message, "system", gameId, userId);

    // 發送系統訊息
    io.to(gameId).emit("system:message", { message });
    io.to(gameId).emit("character:updated", { 
        newCharacter: character,
      })

    return {
      toolResult: {
        characterId,
        hp: character.hp,
        mp: character.mp,
        san: character.san,
        success: true
      },
      functionMessage: message
    };

  } catch (error) {
    console.error("更新角色屬性失敗:", error);
    io.to(gameId).emit("system:error", { functionName: "updateCharacterStats", error: error.message });
    return {
      toolResult: {
        success: false,
        error: error.message
      },
      messageId: null
    };
  }
};

const updateCharacterStatsDeclaration = {
  name: "updateCharacterStats",
  description: "當需要更新 TRPG 角色的 HP、MP 和 SAN 屬性時自行使用，並確保數值不超過最大值或低於 0。",
  parameters: {
    type: "object",
    properties: {
      hp: {
        type: "number",
        description: "新的 HP 值（可選）。必須為非負整數。"
      },
      mp: {
        type: "number",
        description: "新的 MP 值（可選）。必須為非負整數。"
      },
      san: {
        type: "number",
        description: "新的 SAN 值（可選）。必須為 0 到 100 之間的整數。"
      },
    },
    required: []
  }
};

export default { 
    updateCharacterStats, 
    updateCharacterStatsDeclaration,
};