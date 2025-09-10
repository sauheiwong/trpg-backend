import { io } from "../app.js";
import messageHandlers from "../handlers/messageHandlers.js";
import geminiCOCController from "./geminiCOCController.js";

const rollDice = async(req, res) => {
  const dice = req.body.dice; // e.g., '2d6', 'd20', '1d10+1', '2d8-2'
  const gameId = req.body.gameId;

  const diceRegex = /^(\d*)d(\d+)\s*([+-]\s*\d+)?$/i;

  const match = dice.replace(/\s/g, "").match(diceRegex);

  if (!match) {
    return res.status(400).send({ message: "Invalid dice format" });
  }

  try {
    const numberOfDice = match[1] ? parseInt(match[1], 10) : 1;

    const sides = parseInt(match[2], 10);

    const modifier = match[3] ? parseInt(match[3], 10) : 0;

    let result = "";
    let total = 0;
    for (let i = 0; i < numberOfDice; i++) {
      const diceResult = Math.floor(Math.random() * sides) + 1;
      result += "+" + diceResult;
      total += diceResult;
    }

    if (modifier !== 0) {
      result += (modifier > 0 ? "+" : "") + modifier;
      total += modifier;
    }

    const message = `Player Rolled a 🎲 ${dice} : ${result.slice(1)} => ${total}`

    await messageHandlers.createMessage(
      `/roll ${dice}`,
      "user",
      gameId,
      req.user._id
    )

    console.log("roll result: ", message)

    io.to(gameId).emit("systemMessage:received", { message, followingMessage: "Gemini is handling the result...🖋️" });

    geminiCOCController.handlerUserMessageCOCChat({ message, gameId }, req.user, "system")

    return res.status(200).send({ message: "ok" });
    
  } catch (error) {
    return res.status(400).send({ message: "Invalid dice format" });
  }
};

export default {
  rollDice,
};
