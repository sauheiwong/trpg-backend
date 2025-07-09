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

const getConservation = async (req, res) => {
  try {
    const conversations = await conversationHandlers.getConservation(
      req.query,
      req.user._id
    );
    return res.status(200).send({ conversations });
  } catch (error) {
    return errorReturn(res, error);
  }
};

const editConservationById = async (req, res) => {
  try {
    const conversations = await conversationHandlers.editConservationById(
      req.params.id,
      req.body.title,
      req.user._id
    );
    return res.status(200).send({ message: true });
  } catch (error) {
    return errorReturn(res, error);
  }
};

export default {
  getConservationById,
  getConservation,
  editConservationById,
};
