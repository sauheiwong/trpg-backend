import { io } from "../../app.js";
import { Type } from "@google/genai";
import rollDiceTool from "./rollDiceTool.js";
import AttributeDefinitionSchema from "../../models/AttibuteDefinition.js";
import { all } from "axios";
 
const allocateCharacterPoint = async({ gameId, language_code }) => {
    try{
        const displayLanguage = language_code ? language_code.trim() : "en";

        const allAttributes = await AttributeDefinitionSchema.find({}).lean();

        const LUCK_value = rollDiceTool.rollDice("(3d6)*5").result;

        // console.log(`allAttributes:\n${JSON.stringify(allAttributes, null, 2)}`);

        const items = {
            "LUCK": {
                displayLabel: "LUCK",
                value: LUCK_value,
                keyboardType: "numeric",
                editable: false,
                placeholder: "Your LUCK",
            },
        }

        allAttributes.forEach((element) => {
            items[element._id] = {
                displayLabel: element.key[displayLanguage],
                value: element.baseValue+"",
                minValue: element.minValue,
                maxValue: element.maxValue,
                editable: element.editable,
                placeholder: element.placeholder[displayLanguage]
            }
        });


        const formData = {
            title: "Allocate Your Point",
            point: {
                "name": "Attribute Pt.",
                "value": 460,
            },
            items
        }
        io.to(gameId).emit("formAvailable:received", { formData })
        return { toolResult: {
                result: "success",
                message: `LUCK is: ${LUCK_value}.Please tell player to kick the infor icon on the right top. After you get the occupation of character and the place and time of the plot, please use 'allocateSkillPoint' to create another UI for player.`
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

const allocateCharacterPointDeclaration = {
  name: "allocateCharacterPoint",
  description: "當玩家沒有角色，並希望透過點數購買的方式來創建新角色時，使用此工具為玩家創造出介面。此工具也會隨機生成幸運值。",
};

export default {
    allocateCharacterPointDeclaration,
    allocateCharacterPoint,
}