import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";

import mongoose from "mongoose";

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

export default {
  getConservationById,
};
