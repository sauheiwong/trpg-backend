import { io } from "../../app.js";
import { Type } from "@google/genai";
 
const allocateSkillPoint = async({ gameId, occupationSkills, totalPoint }) => {
    try{
        const items = {};
        console.log(`type of occupationSkills is: ${typeof(occupationSkills)}`)
        // --- Defensive Check and Transformation ---
        // Check if occupationSkills is an object but not an array
        // This is a common case when the model returns {"0": ..., "1": ...}
        if (typeof occupationSkills === 'object' && !Array.isArray(occupationSkills) && occupationSkills !== null) {
            console.log("occupationSkills was an object, converting to array...");
            // Convert the object's values into an array
            occupationSkills = Object.values(occupationSkills);
        } 
        occupationSkills.forEach((skill) => {
            items[skill.key] = {
                ...skill,
                key: skill.displayLabel,
                value: skill.baseValue,
                minValue: skill.baseValue,
                maxValue: 99,
                editable: true,
                placeholder: skill.displayLabel,
            }
            totalPoint += skill.baseValue
        })

        const formData = {
            title: "Allocate Your Point",
            point: {
                "name": "Occupation Pt.",
                "value": parseInt(totalPoint, 10),
            },
            items
        }
        io.to(gameId).emit("formAvailable:received", { formData })
        return { toolResult: {
                result: "success",
                message: "Please tell player to kick the infor icon on the right top."
            }, 
            functionMessage: "Gemini create an UI for you.😉"
        };
    } catch (e) {
        const errorMessage = `Error⚠️: fail to create an UI: ${e.message}`
        io.to(gameId).emit("systemMessage:received", { message: errorMessage })
        return {
            toolResult: {
                result: "error",
                message: errorMessage
            }
        }
    }
    
}

const allocateSkillPointDeclaration = {
    name: "allocateSkillPoint",
    description:
    "當玩家已經提供了角色屬性值、職業和故事時代地點背景，在進行職業點數分配時使用此工具。",
    parameters: {
        type: Type.OBJECT,
        properties: {
            occupationSkills: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        key: {
                            type: Type.STRING,
                            description: "技能的名稱，必須使用英文而且不能有空格"
                        },
                        displayLabel: {
                            type: Type.STRING,
                            description: "技能的名稱，要和生成語言一致"
                        },
                        baseValue: {
                            type: Type.NUMBER,
                            description: "技能的基本值"
                        }
                    },
                    required: ["displayLabel", "baseValue", "key"],
                },
                description: "與玩家角色職業最相關的技能，由你提供。此欄位必須是一個 JSON 陣列 (array)",
                minItems: 6,
                maxItems: 10,
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