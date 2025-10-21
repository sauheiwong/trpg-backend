// Import the socket.io instance, likely for real-time communication with clients.
import { io } from "../../app.js";
// Import the 'Type' enum from the Google Generative AI library for defining tool parameter types.
import { Type } from "@google/genai";
import { evaluate } from "mathjs";

/**
 * Parses and evaluates a dice roll expression (e.g., '3d6', '(2d6+6)*5').
 * @param {string} expression - The dice expression to evaluate.
 * @returns {object|string} An object with the detailed message and result, or an error string.
 */
const rollDice = (expression) => {
  try {
    // First, process the dice notation (e.g., '3d6') within the expression.
    const resolvedExpression = expression
      // Remove all whitespace characters from the expression for easier parsing.
      .replace(/\s/g, "")
      // Use a regular expression to find and replace all dice notations (e.g., '2d6', '1d100').
      .replace(/\b(\d+)d(\d+)\b/g, (match, numDice, numSides) => {
        // Convert the captured strings for number of dice and sides into integers.
        const numberOfDice = parseInt(numDice, 10);
        const sides = parseInt(numSides, 10);

        let total = 0;
        // Simulate rolling the dice by looping 'numberOfDice' times.
        for (let i = 0; i < numberOfDice; i++) {
          // For each die, generate a random number between 1 and 'sides'.
          total += Math.floor(Math.random() * sides) + 1;
        }

        return total;
      });

    // Evaluate the expression to get the final result.
    const finalResult = evaluate(resolvedExpression);

    // Return a structured object containing the full process and the final numeric result.
    console.log(
      `got result:\n${JSON.stringify(
        {
          message: `${expression} => ${resolvedExpression} = ${Math.floor(
            finalResult
          )}`,
          result: Math.floor(finalResult),
        },
        null,
        2
      )}`
    );
    return {
      message: `${expression} => ${resolvedExpression} = ${Math.floor(
        finalResult
      )}`,
      result: Math.floor(finalResult),
    };
  } catch (error) {
    return new Error("Invalid dice format");
  }
};

/**
 * Handles a single dice roll for a character, determines success, and notifies clients.
 * This is a tool function intended to be called by the Gemini model.
 * @param {object} params - The parameters for the dice roll.
 * @returns {object} An object containing results for the tool and a message for the model.
 */
const rollSingleDice = async ({
  actor,
  reason,
  dice,
  success,
  secret,
  gameId,
}) => {
  try {
    // Use the rollDice utility to get the result of the dice expression.
    const rollResult = rollDice(dice);

    // Log the detailed result to the server console for debugging.
    console.log(
      `roll dice: ${rollResult.message}, success limit is: ${success}, so ${
        rollResult.result <= success
      }`
    );

    // Prepare the data that will be returned to the Gemini model.
    const responseData = {
      actor,
      reason,
      dice,
      result: rollResult.message,
      // Determine if the roll was successful by comparing the result to the success threshold.
      success: rollResult.result <= success,
    };

    // Create a descriptive message summarizing the action and outcome.
    let message = `rollSingleDice:\n${JSON.stringify(responseData, null, 2)}`;
    const followingMessage = "Gemini is handling the result...";

    // Check if the roll is meant to be secret.
    if (!secret) {
      // If public, emit the full result to all clients in the specified game room.
      io.to(gameId).emit("system:message", { message, followingMessage });
    } else {
      // If secret, emit a generic message to clients, hiding the actual result.
      message = "KP roll a secret dice.";
      io.to(gameId).emit("system:message", { message, followingMessage });
    }

    // Return the result to the Gemini model so it can continue its reasoning.
    return { toolResult: responseData, functionMessage: message };
  } catch (e) {
    console.error(`Error ⚠️: fail to roll a dice: ${e.message}`);
    io.to(gameId).emit("system:error", {
      functionName: "rollSingleDice",
      error: e.message,
    });
    return {
      toolResult: {
        result: "error",
        error: "Failed to roll a dice",
        details: error.message,
      },
    };
  }
};

// This is the schema definition for the 'rollSingleDice' tool.
// It tells the Gemini model what the function does and what parameters it expects.
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
        description:
          "本次擲骰的原因或目的。例如：'理智檢定'、'手槍射擊'。必須使用和對話相同的語言。",
      },
      dice: {
        type: Type.STRING,
        description:
          "要擲的骰子表達式，格式為 'NdM+X'。例如：'1d100'、'1d8+1'。",
      },
      success: {
        type: Type.NUMBER,
        description: "行動成功的上限值。擲骰結果必須小於或等於此數值才算成功。",
      },
      secret: {
        type: Type.BOOLEAN,
        description: "暗骰開關。如果為true, 結果就不會向玩家展示。",
      },
    },
    required: ["actor", "reason", "dice", "success"],
  },
};

/**
 * Generates a full set of character attributes (stats) by rolling dice for each.
 * This is a tool function intended to be called by the Gemini model.
 * @param {object} params - The parameters for the function call.
 * @returns {object} An object containing the generated attributes and a summary message.
 */
const rollCharacterStatus = async ({ gameId }) => {
  // Define the standard attributes for a character and their corresponding dice formulas.
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

  attributes.forEach((attr) => {
    // Call the rollDice utility for each attribute's formula.
    result[`${attr.name}`] = rollDice(attr.dice);
  });

  const message = `Character generation result is:\n${JSON.stringify(
    result,
    null,
    2
  )}`;
  const followingMessage = "Gemini is handling the result";

  // Emit the result to all clients in the specified game room.
  io.to(gameId).emit("system:message", { message, followingMessage });

  // Return the generated attributes to the Gemini model.
  return { toolResult: result, functionMessage: message };
};

// This is the schema definition for the 'rollCharacterStatus' tool.
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
  rollDice,
};
