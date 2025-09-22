import { io } from "../../app.js";
import { Type } from "@google/genai";

import messageHandlers from "../../handlers/messageHandlers.js";

const rollDice = (expression) => {
  try {
    const resolvedExpression = expression
      .replace(/\s/g, "")
      .replace(/\b(\d+)d(\d+)\b/g, (match, numDice, numSides) => {
        const numberOfDice = parseInt(numDice, 10);
        const sides = parseInt(numSides, 10);

        let total = 0;
        for (let i = 0; i < numberOfDice; i++) {
          total += Math.floor(Math.random() * sides) + 1;
        }

        return total;
      });

    const calculate = new Function(`return ${resolvedExpression}`);
    const finalResult = calculate();

    return {
      message: `${expression} => ${resolvedExpression} = ${Math.floor(finalResult)}`,
      result: Math.floor(finalResult),
    };
  } catch (error) {
    return "Invalid dice format";
  }
};

const rollSingleDice = async({ actor, reason, dice, success, secret, gameId, userId }) => {
  const rollResult = rollDice(dice);

  console.log(`roll dice: ${rollResult.message}, success limit is: ${success}, so ${rollResult.result <= success}`);

  const responseData = {
    actor,
    reason,
    dice,
    result: rollResult.message,
    success: rollResult.result <= success,
  }

  const message = `rollSingleDice: ${JSON.stringify(responseData)}, success limit is: ${success}, so ${rollResult.result <= success ? "SUCCESS" : "FAIL"}`
  const followingMessage = "Gemini is handling the result..."

  if (!secret){
    io.to(gameId).emit("systemMessage:received", { message, followingMessage });
  } else {
    io.to(gameId).emit("systemMessage:received", { message: "KP roll a secret dice.", followingMessage });
  }

  // const newMessage = await messageHandlers.createMessage(message, "system", gameId, userId);

  return { toolResult: responseData };
};

const rollSingleDiceDeclaration = {
  name: "rollSingleDice",
  description:
    "為遊戲中的一個角色擲骰。只適用於處理一次檢定或計算的場景。不適用於角色生成時。",
  parameters: {
    type: Type.OBJECT,
    properties: {
      actor: {
        type: Type.STRING,
        description: "擲骰的角色名稱。例如：'邪教徒A'、'玩家B'。",
      },
      reason: {
        type: Type.STRING,
        description: "本次擲骰的原因或目的。例如：'理智檢定'、'手槍射擊'。",
      },
      dice: {
        type: Type.STRING,
        description:
          "要擲的骰子表達式，格式為 'NdM+X'。例如：'1d100'、'1d8+1'。",
      },
      success: {
        type: Type.NUMBER,
        description: "行動成功的上限值。擲骰結果必須小於或等於此數值才算成功。"
      },
      secret: {
        type: Type.BOOLEAN,
        description: "暗骰開關。如果為true, 結果就不會向玩家展示。"
      }
    },
    required: ["actor", "reason", "dice", "success"],
  },
};

const rollCharacterStatus = async({ gameId, userId }) => {

  const attributes = [
    { name: "STR", dice: "(3d6)*5" },
    { name: "CON", dice: "(3d6)*5" },
    { name: "SIZ", dice: "(2d6+6)*5" },
    { name: "DEX", dice: "(3d6)*5" },
    { name: "APP", dice: "(3d6)*5" },
    { name: "INT", dice: "(2d6+6)*5" },
    { name: "POW", dice: "(3d6)*5" },
    { name: "EDU", dice: "(2d6+6)*5" },
    { name: "LUCK", dice: "(3d6)*5" },
  ];

  const result = {};

  let resultMessage = "";

  attributes.forEach((attr) => {
    result[`${attr.name}`] = rollDice(attr.dice);
    resultMessage += `${attr.name}: ${result[`${attr.name}`].result} \n`
  })

  const message = `rollCharacterStatus result is: 
  ${JSON.stringify(resultMessage)}
  `
  const followingMessage = "Gemini is handling the result"

  // const newMessage = await messageHandlers.createMessage(message, "system", gameId, userId);

  io.to(gameId).emit("systemMessage:received", { message, followingMessage })
  
  return { toolResult: result };
};

const rollCharacterStatusDeclaration = {
  name: "rollCharacterStatus",
  description:
    "當玩家沒有角色，並希望透過隨機擲骰的方式來創建新角色時，使用此工具生成角色的初始六大屬性（力量、敏捷、體質等）。",
};

export default {
  rollSingleDice,
  rollSingleDiceDeclaration,
  rollCharacterStatus,
  rollCharacterStatusDeclaration,
};
