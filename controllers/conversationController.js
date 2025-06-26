import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";

import mongoose from "mongoose";

import { errorReturn } from "../handlers/errorHandlers.js";

import conversationHandlers from "../handlers/conversationHandlers.js";

const getConservationById = async (req, res) => {
  const conversationId = req.params.id;
  try {
    const result = await conversationHandlers.getConservationById(
      conversationId,
      req.user._id
    );
    return res.status(200).send(result);
  } catch (error) {
    return errorReturn(res, error);
  }
};

export default {
  getConservationById,
};
