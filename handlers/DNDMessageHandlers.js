import Game from "../models/DNDGameModel.js";
import Message from "../models/DNDMessageModel.js";

import mongoose from "mongoose";

const createMessage = async (message, role, gameId, userId) => {
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

    if (!message || !role) {
      throw errorStatus("miss message or role", 500);
    }

    return await Message.create({
      gameId,
      role,
      content: message,
    });
  } catch (error) {
    throw error;
  }
};

export default {
  createMessage,
};
