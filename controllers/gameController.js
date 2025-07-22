import { errorReturn } from "../handlers/errorHandlers.js";

import gameHandlers from "../handlers/gameHandlers.js";

const getConservationById = async (req, res) => {
  const gameId = req.params.id;
  try {
    const result = await gameHandlers.getConservationById(
      gameId,
      req.user._id
    );
    return res.status(200).send(result);
  } catch (error) {
    return errorReturn(res, error);
  }
};

const getConservation = async (req, res) => {
  try {
    const games = await gameHandlers.getConservation(
      req.query,
      req.user._id
    );
    return res.status(200).send({ games });
  } catch (error) {
    return errorReturn(res, error);
  }
};

const editConservationById = async (req, res) => {
  try {
    const game = await gameHandlers.editConservationById(
      req.params.id,
      req.body.title,
      req.user._id
    );
    return res.status(200).send({ message: true });
  } catch (error) {
    return errorReturn(res, error);
  }
};

const deleteConservationById = async (req, res) => {
  try {
    const game = await gameHandlers.deleteConservationById(
      req.params.id,
      req.user._id
    );

    return res
      .status(200)
      .send({ gameId: game._id, message: "deleted" });
  } catch (error) {
    return errorReturn(res, error);
  }
};

export default {
  getConservationById,
  getConservation,
  editConservationById,
  deleteConservationById,
};
