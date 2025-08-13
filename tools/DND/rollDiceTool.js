const rollDice = (expression) => {
  try {
    const resolvedExpression = expression
      .replace(/\s/g, "")
      .replace(/\b(\d+)d(\d+)\b/g, (match, numDice, numSides) => {
        const numberOfDice = parseInt(numDice, 10) || 1;
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

const rollCharacterStats = async () => {
  console.log("Rolling D&D character stats (4d6 drop lowest, 6 times)");
  const stats = [];
  for (let i = 0; i < 6; i++) {
    const rolls = [];
    for (let j = 0; j < 4; j++) {
      rolls.push(Math.floor(Math.random() * 6) + 1);
    }
    rolls.sort((a, b) => a - b);
    rolls.shift(); // 移除最低值
    const sum = rolls.reduce((a, b) => a + b, 0);
    stats.push(sum);
  }
  return `You rolled the following scores for your attributes: ${stats.join(
    ", "
  )}. You can now assign them to Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma.`;
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
    },
    required: ["actor", "reason", "dice"],
  },
};

const rollCharacterStatsDeclaration = {
  name: "rollCharacterStats",
  description:
    "在創建 D&D 角色時，如果玩家選擇擲骰方式並要求 DM 代勞，則呼叫此工具來生成六項屬性值。",
  parameters: {
    type: "object",
    properties: {},
  },
};

export default {
  rollSingleDice,
  rollCharacterStats,
  rollSingleDiceDeclaration,
  rollCharacterStatsDeclaration,
};
