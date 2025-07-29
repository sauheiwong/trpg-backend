import CharacterChat from "../models/characterChatModel.js";
import Message from "../models/characterChatMessageModel.js";
import Character from "../models/characterModel.js";

import mongoose from "mongoose";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

import { errorStatus } from "./errorHandlers.js";

const createCharacterChat = async (userId, characterId) => {
  try {
    return await CharacterChat.create({ userId, characterId });
  } catch (error) {
    throw error;
  }
};

const getChatById = async (chatId, userId) => {
  try {
    if (!chatId) {
      throw errorStatus("miss chat id", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      throw errorStatus("Invaild id", 400);
    }

    const chat = await CharacterChat.findById(chatId);

    if (!chat) {
      throw errorStatus("not found", 404);
    }

    if (!chat.userId.equals(userId)) {
      throw errorStatus("Forbidden", 403);
    }

    const messages = await Message.find({
      chatId: chat._id,
    })
      .sort({ timestamp: 1 })
      .select("role content")
      .exec();

    const character = await Character.findById(chat.characterId);
    return {
      messages,
      character,
    };
  } catch (error) {
    throw error;
  }
};

const getGame = async (query, userId) => {
  query.userId = userId;
  const games = await Game.find(query).select("title updatedAt");
  return games;
};

const editGameById = async (gameId, newTitle, userId) => {
  try {
    if (!newTitle) {
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

    newTitle = DOMPurify.sanitize(newTitle, { USE_PROFILES: { html: true } });

    await Game.findByIdAndUpdate(gameId, { title: newTitle });

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
  createCharacterChat,
  getChatById,
};
