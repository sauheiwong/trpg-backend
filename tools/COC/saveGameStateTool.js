const updateGameStateDeclaration = {
    name: "updateGameState",
    description: "更新遊戲的核心世界狀態，例如角色的HP、位置、物品或世界事實。",
    parameters: {
        type: "OBJECT", // 習慣上建議用大寫
        properties: {
            characterUpdates: {
                type: "OBJECT",
                description: "關於角色的更新。",
                properties: {
                    hp: { type: "NUMBER", description: "角色新的HP值" },
                    mp: { type: "NUMBER", description: "角色新的MP值" },
                    san: { type: "NUMBER", description: "角色新的SAN值" },
                    location: { type: "STRING", description: "角色目前所在的新位置" },
                    inventory: {
                        type: "OBJECT",
                        description: "更新角色物品欄",
                        properties: {
                            add: { type: "ARRAY", items: { type: "STRING" }, description: "新增到物品欄的物品列表" },
                            remove: { type: "ARRAY", items: { type: "STRING" }, description: "從物品欄移除的物品列表" }
                        }
                    }
                }
            },
            worldUpdates: {
                type: "OBJECT",
                description: "關於遊戲世界的更新。",
                properties: {
                    time: { type: "STRING", description: "更新遊戲內的時間，例如 '下午3點' 或 '深夜'" },
                    date: { type: "STRING", description: "更新遊戲內的日期" },
                    weather: { type: "STRING", description: "描述當前的天氣狀況，例如 '暴雨' 或 '起了濃霧'" },
                }
            },
            // 修正點：將 plotUpdates 整個物件移到這裡
            plotUpdates: {
                type: "OBJECT",
                description: "更新遊戲劇情和線索的狀態。",
                properties: {
                    fact: { type: "STRING", description: "需要被記住的世界級事實或背景設定" },
                    clueDiscovered: {
                        type: "OBJECT",
                        description: "一個被發現的線索及其內容",
                        properties: {
                            id: { type: "STRING", description: "線索的唯一標識符" },
                            description: { type: "STRING", description: "線索的具體內容或指向" }
                        }
                    },
                    eventTriggered: { type: "STRING", description: "描述一個被觸發的關鍵劇情事件" },
                    sceneStatusUpdate: {
                        type: "OBJECT",
                        description: "更新某個特定場景或地點的狀態",
                        properties: {
                            locationName: { type: "STRING", description: "發生變化的地點名稱" },
                            newStatus: { type: "STRING", description: "該地點的新狀態，例如 '圖書館的暗門被發現了' 或 '宅邸一樓起火了'" }
                        }
                    }
                }
            }
        },
        required: []
    }
}

const updateGameState = async(updates) => {
    try {

        const { characterUpdates, worldUpdates, plotUpdates, game } = updates

        if (characterUpdates) {
            game.gameState.character = { ...game.gameState.character, ...characterUpdates };

            if (characterUpdates.inventory) {
                if (!Array.isArray(game.gameState.character.inventory)) {
                    game.gameState.character.inventory = [];
                }

                if (characterUpdates.inventory.add?.length > 0) {
                    game.gameState.character.inventory.push(...characterUpdates.inventory.add);
                }

                if (characterUpdates.inventory.remove?.length > 0) {
                    const itemsToRemove = new Set(characterUpdates.inventory.remove);
                    game.gameState.character.inventory = game.gameState.character.inventory.filter(item => !itemsToRemove.has(item));
                }

                delete game.gameState.character.inventory.add;
                delete game.gameState.character.inventory.remove;
            }
        }

        if (worldUpdates) {
            game.gameState.world = { ...game.gameState.world, ...worldUpdates };
        }

        if (plotUpdates) {
            game.gameState.plot = { ...game.gameState.plot, ...plotUpdates };
        }

        game.markModified("gameState");

        await game.save();

        console.log("Game state update success!");

        return { result: "success" };

    } catch (error) {
        console.error("Error ⚠️: fail to update game state: ", error)
        return { result: "fail", message: error.message }
    }
}

export default {
    updateGameStateDeclaration,
    updateGameState,
};
