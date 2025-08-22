import Game from "../models/DNDGameModel.js";
import Message from "../models/DNDMessageModel.js";
import Character from "../models/DNDCharacterModel.js";

import mongoose from "mongoose";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

import { errorStatus } from "./errorHandlers.js";

const createGame = async (userId) => {
  try {
    return await Game.create({ userId, title: "new game" });
  } catch (error) {
    throw error;
  }
};

const getGame = async (query, userId) => {
  try {
    const games = await Game.find({ userId }) //{ ...query, userId }
      .select("title updatedAt")
      .exec();
    // console.log(games);
    return games;
  } catch (error) {
    throw error;
  }
};

const getGameById = async (gameId, userId) => {
  try {
    if (!gameId) {
      throw errorStatus("miss game id", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      throw errorStatus("Invaild id", 400);
    }

    const game = await Game.findById(gameId);

    if (!game) {
      throw errorStatus("not found", 404);
    }

    if (!game.userId.equals(userId)) {
      throw errorStatus("Forbidden", 403);
    }

    const messages = await Message.find({
      gameId: game._id,
    })
      .sort({ timestamp: 1 })
      .select("role content")
      .exec();

    const character = await Character.findById(game.characterId);

    // console.log("character in getGameById is: ", character);

    return {
      title: game.title,
      memo: game.memo,
      messages,
      character,
    };
  } catch (error) {
    throw error;
  }
};

const editGameById = async (gameId, { newTitle, newMemo }, userId) => {
  try {
    if (!newTitle && !newMemo) {
      throw errorStatus("please provide title", 400);
    }

    if (!gameId) {
      throw errorStatus("miss game id", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      throw errorStatus("Invaild id", 400);
    }

    const game = await Game.findById(gameId);

    if (!game) {
      throw errorStatus("not found", 404);
    }

    if (!game.userId.equals(userId)) {
      throw errorStatus("Forbidden", 403);
    }

    const window = new JSDOM("").window;
    const DOMPurify = createDOMPurify(window);

    const newContent = {};

    if (newTitle) {
      newContent["title"] = DOMPurify.sanitize(newTitle, {
        USE_PROFILES: { html: true },
      });
    }

    if (newMemo) {
      newContent["memo"] = DOMPurify.sanitize(newMemo, {
        USE_PROFILES: { html: true },
      });
    }

    await Game.findByIdAndUpdate(gameId, newContent);

    return true;
  } catch (error) {
    throw error;
  }
};

const deleteGameById = async (gameId, userId) => {
  try {
    if (!gameId) {
      throw errorStatus("miss game id", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(gameId)) {
      throw errorStatus("Invaild id", 400);
    }

    const game = await Game.findById(gameId);

    if (!game) {
      throw errorStatus("not found", 404);
    }

    if (!game.userId.equals(userId)) {
      throw errorStatus("Forbidden", 403);
    }

    return await Game.findByIdAndDelete(gameId);
  } catch (error) {
    throw error;
  }
};

export default {
  createGame,
  getGame,
  getGameById,
  editGameById,
  deleteGameById,
};
