import { io } from "../../app.js";

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

    return `${expression} => ${resolvedExpression} = ${Math.floor(
      finalResult
    )}`;
  } catch (error) {
    return "Invalid dice format";
  }
};

const rollSingleDice = ({ actor, reason, dice, success, gameId }) => {
  const rollResult = rollDice(dice);

  console.log(`roll dice: ${rollResult}, success limit is: ${success}, so ${rollResult <= success}`);

  const responseData = {
    actor,
    reason,
    dice,
    result: rollResult,
    success: rollResult <= success,
  }

  io.to(gameId).emit("systemMessage:received", { message: `roll dice: ${rollResult}, success limit is: ${success}, so ${rollResult <= success}` })

  return responseData;
};

const rollSingleDiceDeclaration = {
  name: "rollSingleDice",
  description:
    "為遊戲中的一個角色擲骰。只適用於處理一次檢定或計算的場景。不適用於角色生成時。",
  parameters: {
    type: "object",
    properties: {
      actor: {
        type: "string",
        description: "擲骰的角色名稱。例如：'邪教徒A'、'玩家B'。",
      },
      reason: {
        type: "string",
        description: "本次擲骰的原因或目的。例如：'理智檢定'、'手槍射擊'。",
      },
      dice: {
        type: "string",
        description:
          "要擲的骰子表達式，格式為 'NdM+X'。例如：'1d100'、'1d8+1'。",
      },
      success: {
        type: "number",
        description: "行動成功的上限值。擲骰結果必須小於或等於此數值才算成功。"
      },
    },
    required: ["actor", "reason", "dice", "success"],
  },
};

const rollCharacterStatus = ({ gameId }) => {
  const attributes = [
    { name: "力量 (STR)", dice: "(3d6)*5" },
    { name: "體質 (CON)", dice: "(3d6)*5" },
    { name: "體型 (SIZ)", dice: "(2d6+6)*5" },
    { name: "敏捷 (DEX)", dice: "(3d6)*5" },
    { name: "外貌 (APP)", dice: "(3d6)*5" },
    { name: "智力 (INT)", dice: "(2d6+6)*5" },
    { name: "意志 (POW)", dice: "(3d6)*5" },
    { name: "教育 (EDU)", dice: "(2d6+6)*5" },
    { name: "幸運 (LUCK)", dice: "(3d6)*5" },
  ];

  const result = {};

  attributes.forEach((attr) => {
    result[`${attr.name}`] = rollDice(attr.dice)
  })

  io.to(gameId).emit("systemMessage:received", { message: "roll character status is: \n"+result })

  return result;
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
