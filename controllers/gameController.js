import { errorReturn } from "../handlers/errorHandlers.js";

import gameHandlers from "../handlers/gameHandlers.js";

const getGameById = async (req, res) => {
  const gameId = req.params.id;
  try {
    const result = await gameHandlers.getGameById(gameId, req.user._id);
    return res.status(200).send(result);
  } catch (error) {
    return errorReturn(res, error);
  }
};

const getGame = async (req, res) => {
  try {
    const games = await gameHandlers.getGame(req.query, req.user._id);
    return res.status(200).send({ games });
  } catch (error) {
    return errorReturn(res, error);
  }
};

const editGameById = async (req, res) => {
  try {
    const game = await gameHandlers.editGameById(
      req.params.id,
      req.body.title,
      req.user._id
    );
    return res.status(200).send({ message: true });
  } catch (error) {
    return errorReturn(res, error);
  }
};

const deleteGameById = async (req, res) => {
  try {
    const game = await gameHandlers.deleteGameById(req.params.id, req.user._id);

    return res.status(200).send({ gameId: game._id, message: "deleted" });
  } catch (error) {
    return errorReturn(res, error);
  }
};

export default {
  getGameById,
  getGame,
  editGameById,
  deleteGameById,
};
