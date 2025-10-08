import { io } from "../../app.js";
import rollDiceTool from "./rollDiceTool.js";
import AttributeDefinitionSchema from "../../models/AttibuteDefinition.js";
 
const allocateCharacterPoint = async({ gameId, language_code }) => {
    try{
        const displayLanguage = language_code ? language_code.trim() : "en";

        const allAttributes = await AttributeDefinitionSchema.find({}).lean();

        const items = {
            "LUCK": {
                key: "LUCK",
                value: rollDiceTool.rollDice("(3d6)*5").result,
                keyboardType: "numeric",
                editable: false,
                placeholder: "Your LUCK",
            },
        }

        allAttributes.forEach((element) => {
            items[element._id] = {
                key: element.key[displayLanguage],
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

const allocateCharacterPointDeclaration = {
  name: "allocateCharacterPoint",
  description:
    "當玩家沒有角色，並希望透過點數購買的方式來創建新角色時，使用此工具為玩家創造出介面。此工具也會隨機生成幸運值。",
};

export default {
    allocateCharacterPointDeclaration,
    allocateCharacterPoint,
}