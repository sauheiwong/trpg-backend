import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";

import mongoose from "mongoose";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

import { errorStatus, errorReturn } from "../handlers/errorHandlers.js";

const getConservationById = async (conversationId, userId) => {
  if (!conversationId) {
    throw errorStatus("miss conversation id", 400);
  }

  if (!mongoose.Types.ObjectId.isValid(conversationId)) {
    throw errorStatus("Invaild id", 400);
  }

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw errorStatus("not found", 404);
  }

  if (!conversation.userId.equals(userId)) {
    throw errorStatus("Forbidden", 403);
  }

  const messages = await Message.find({
    conversationId: conversation._id,
  })
    .sort({ timestamp: 1 })
    .select("role content");

  return {
    title: conversation.title,
    messages,
  };
};

const getConservation = async (query, userId) => {
  query.userId = userId;
  const conversations = await Conversation.find(query).select(
    "title updatedAt"
  );
  return conversations;
};

const editConservationById = async (conversationId, newTitle, userId) => {
  try {
    if (!newTitle) {
      throw errorStatus("please provide title", 400);
    }
    const window = new JSDOM("").window;
    const DOMPurify = createDOMPurify(window);

    newTitle = DOMPurify.sanitize(newTitle, { USE_PROFILES: { html: true } });

    await Conversation.findByIdAndUpdate(conversationId, { title: newTitle });

    return true;
  } catch (error) {
    throw error;
  }
};

export default {
  getConservationById,
  getConservation,
  editConservationById,
};
