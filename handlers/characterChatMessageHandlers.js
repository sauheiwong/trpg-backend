import Message from "../models/characterChatMessageModel.js";
import Chat from "../models/characterChatModel.js";

import mongoose from "mongoose";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

import { errorStatus } from "./errorHandlers.js";

const createMessage = async (message, role, chatId, userId) => {
  try {
    if (!chatId) {
      throw errorStatus("miss chat id", 400);
    }

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      throw errorStatus("Invaild id", 400);
    }

    const chat = await Chat.findById(chatId);

    if (!chat) {
      throw errorStatus("not found", 404);
    }

    if (!chat.userId.equals(userId)) {
      throw errorStatus("Forbidden", 403);
    }

    if (!message || !role) {
      throw errorStatus("miss message or role", 500);
    }

    return await Message.create({
      chatId,
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
