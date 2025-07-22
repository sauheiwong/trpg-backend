import { Ollama } from "ollama";

import Game from "../models/gameModel.js";
import Message from "../models/messageModel.js";

import gameHandlers from "../handlers/gameHandlers.js";

import { errorReturn } from "../handlers/errorHandlers.js";
import { constructFromSymbol } from "date-fns/constants";
import { model } from "mongoose";

const ollama = new Ollama();

const chatModel = "qwen3:4b";

const chatWithQwenNew = async (req, res) => {
  return res.status(200).send({
    message: "chat without id",
    gameId: "123123",
  });
  const userMessage = req.body.message;
  if (!userMessage) {
    return res.status(400).send({ message: "please provide message" });
  }

  const modelResponse = await ollama.chat({
    model: chatModel,
    messages: [
      {
        role: "user",
        content: userMessage,
      },
    ],
    think: false,
  });

  const modelResponseMessage = modelResponse.message.content;

  const newGame = await Game.create({
    userId: req.user._id,
    title: "New Game",
  });

  await Message.create({
    gameId: newGame._id,
    role: "user",
    content: userMessage,
  });

  await Message.create({
    gameId: newGame._id,
    role: "assistant",
    content: modelResponseMessage,
  });

  return res.status(200).send({
    message: modelResponseMessage,
    gameId: newGame._id,
  });
};

const chatInConservationById = async (req, res) => {
  const gameId = req.params.id;
  const userId = req.user._id;
  const userMessage = req.body.message;

  return res.status(200).send({
    message: "chat with id",
    gameId: gameId,
  });

  if (!userMessage) {
    return res.status(400).send({ message: "please provide message" });
  }

  try {
    const game = await gameHandlers.getConservationById(
      gameId,
      userId
    );

    game.messages.push({
      role: "user",
      content: userMessage,
    });

    const modelResponse = await ollama.chat({
      model: chatModel,
      messages: game.messages,
      think: false,
    });

    const modelResponseMessage = modelResponse.message.content;

    console.log(`${chatModel} say: ${modelResponseMessage}`);

    await Message.create({
      gameId: gameId,
      role: "user",
      content: userMessage,
    });

    await Message.create({
      gameId: gameId,
      role: "assistant",
      content: modelResponseMessage,
    });

    return res.status(200).send({ message: modelResponseMessage });
  } catch (error) {
    return errorReturn(res, error);
  }
};

export default {
  chatWithQwenNew,
  chatInConservationById,
};
