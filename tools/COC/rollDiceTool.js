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

const rollSingleDice = ({ actor, reason, dice }) => {
  return `${actor}${reason}: ${rollDice(dice)}\n`;
};

const rollSingleDiceDeclaration = {
  name: "rollSingleDice",
  description: "為遊戲中的一個角色擲骰。只適用於處理一次檢定或計算的場景。",
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
    },
    required: ["actor", "reason", "dice"],
  },
};

const rollDices = ({ rolls }) => {
  let result = "";
  rolls.forEach((roll) => {
    const diceResult = rollDice(roll.dice);
    result += `${roll.actor}${roll.reason}: ${diceResult}\n`;
  });
  return result;
};

const rollDicesDeclaration = {
  name: "rollDices",
  description:
    "為遊戲中的一個或多個角色同時擲骰。適用於需要一次處理多個檢定或計算的場景。",
  parameters: {
    type: "object",
    properties: {
      rolls: {
        type: "array",
        description: "一個包含所有擲骰請求的陣列。每個請求都是一個獨立的物件。",
        items: {
          type: "object",
          properties: {
            actor: {
              type: "string",
              description: "擲骰的角色名稱。例如：'邪教徒A'、'玩家B'。",
            },
            reason: {
              type: "string",
              description:
                "本次擲骰的原因或目的。例如：'理智檢定'、'手槍射擊'。",
            },
            dice: {
              type: "string",
              description:
                "要擲的骰子表達式，格式為 'NdM+X'。例如：'1d100'、'1d8+1'。",
            },
          },
          required: ["actor", "reason", "dice"],
        },
      },
    },
    required: ["rolls"],
  },
};

const rollCharacterStatus = () => {
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

  const results = attributes.map((attr) => {
    const rollResult = rollDice(attr.dice);
    return `${attr.name}: ${rollResult}`;
  });

  return results.join("\n");
};

const rollCharacterStatusDeclaration = {
  name: "rollCharacterStatus",
  description:
    "當玩家要求為其新角色擲決定基礎屬性（如力量、體質、智力等）時使用此工具。此工具會一次性擲完所有必要的屬性。",
  parameters: {
    type: "object",
    properties: {},
    required: [],
  },
};

export default {
  rollSingleDice,
  rollSingleDiceDeclaration,
  rollDices,
  rollDicesDeclaration,
  rollCharacterStatus,
  rollCharacterStatusDeclaration,
};
