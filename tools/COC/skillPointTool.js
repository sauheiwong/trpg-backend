import { io } from "../../app.js";
import { Type } from "@google/genai";
 
const allocateSkillPoint = async({ gameId, occupationSkills, totalPoint }) => {
    try{
        const items = {};
        
        // 使用 Object.entries 遍歷新的 occupationSkills 物件
        // [key, skillData] 的範例會是：["Climb", { displayLabel: "攀爬", baseValue: 20 }]
        for (const [key, skillData] of Object.entries(occupationSkills)) {
            const { displayLabel, baseValue } = skillData;

            items[key] = { // 使用英文 key 作為 items 物件的 key，方便後續操作
                key: key, // 程式碼內部使用的 key
                displayLabel: displayLabel, // UI 顯示的名稱
                baseValue: baseValue,
                value: baseValue,
                minValue: baseValue,
                maxValue: 99,
                editable: true,
                placeholder: displayLabel,
            }
            totalPoint += baseValue;
        }

        const formData = {
            title: "Allocate Your Point",
            point: {
                "name": "Occupation Pt.",
                "value": parseInt(totalPoint, 10),
            },
            items
        };

        io.to(gameId).emit("form:prompt", { formData });
        return { toolResult: {
                result: "success",
                message: "Please tell player to kick the infor icon on the right top."
            }, 
            functionMessage: "Gemini create an UI for you.😉"
        };
    } catch (e) {
        const errorMessage = `Error⚠️: fail to create an UI: ${e.message}`
        io.to(gameId).emit("system:error", { functionName: "allocateSkillPoint", error: e.message });
        return {
            toolResult: {
                result: "error",
                message: errorMessage
            }
        }
    }
    
}

// 【修改後】的 Declaration
const allocateSkillPointDeclaration = {
    name: "allocateSkillPoint",
    description: "當玩家已經提供了角色屬性值、職業和故事時代地點背景，在進行職業點數分配時使用此工具。",
    parameters: {
        type: Type.OBJECT,
        properties: {
            occupationSkills: {
                type: Type.OBJECT,
                // 使用 additionalProperties 來定義這個物件的值(value)應該長什麼樣子
                additionalProperties: {
                    type: Type.OBJECT,
                    properties: {
                        displayLabel: {
                            type: Type.STRING,
                            description: "技能的顯示名稱。此字串必須與玩家當前的對話語言完全一致。例如，如果玩家使用英文，這裡就必須是英文。"
                        },
                        baseValue: {
                            type: Type.NUMBER,
                            description: "技能的基礎值。"
                        }
                    },
                    required: ["displayLabel", "baseValue"]
                },
                description: "一個包含所有職業技能的物件。物件的鍵(key)是技能的英文程式碼，值(value)是一個包含 displayLabel 和 baseValue 的物件，最少6個，最多10個。範例 (當玩家說英文時): {\"ArtCraft_Acting\": {\"displayLabel\": \"Art/Craft (Acting)\", \"baseValue\": 5}, \"Charm\": {\"displayLabel\": \"Charm\", \"baseValue\": 15}}",
            },
            totalPoint: {
                type: Type.NUMBER,
                description: "角色的總職業點數"
            }
        },
        required: ["occupationSkills", "totalPoint"]
    }
};

export default {
    allocateSkillPointDeclaration,
    allocateSkillPoint,
}