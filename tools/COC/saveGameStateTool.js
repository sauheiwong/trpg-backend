import Game from '../../models/gameModel.js'

const updateGameStateDeclaration = {
    name: "updateGameState",
    description: "更新遊戲的核心世界狀態，例如角色的HP、位置、物品或世界事實。",
    parameters: {
        type: "object",
        properties: {
        characterUpdates: {
            type: "object",
            description: "關於角色的更新。",
            properties: {
                hp: { type: "number", description: "角色新的HP值" },
                mp: { type: "number", description: "角色新的MP值" },
                san: { type: "number", description: "角色新的SAN值" },
                location: { type: "string", description: "角色目前所在的新位置" }
            }
        },
        worldUpdates: {
            type: "object",
            description: "關於遊戲世界的更新。",
            properties: {
                newFact: { type: "string", description: "一個新發現的、需要被記住的世界事實" },
                npcStatus: { type: "object", description: "更新NPC的狀態" }
            }
        }
        },
        required: [] // 可以讓所有欄位都是可選的，LLM 只會提供有變化的部分
    }
}

const updateGameState = async(updates) => {
    const gameId = updates.gameId;

    const updateObject = {};

    if (updates.characterUpdates) {
        for (const key in updates.characterUpdates) {
            updateObject[`gameState.character.${key}`] = updates.characterUpdates[key];
        }
    }

    if (updates.worldUpdates) {
        for (const key in updates.worldUpdates) {
            updateObject[`gameState.world.${key}`] = updates.worldUpdates[key];
        }
    }

    await Game.findByIdAndUpdate(gameId, { $set: updateObject })

    return { result: "success" }
}

const updateKpMemoDeclaration = {
    name: "updateKpMemo",
    description: "更新或覆蓋KP的劇情摘要筆記。",
    parameters: {
        type: "object",
        properties: {
            newSummary: {
                type: "string",
                description: "一段新的、完整的劇情摘要，將會覆蓋舊的摘要。"
            }
        },
        required: ["newSummary"]
    }
}

const updateKpMemo = async({ gameId, newSummary }) => {
    await Game.findByIdAndUpdate(gameId, { $set: { KpMemo: newSummary }})
    return { result: "success" }
}

export default {
    updateGameStateDeclaration,
    updateGameState,
    updateKpMemoDeclaration,
    updateKpMemo,
};
