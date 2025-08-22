import { errorReturn } from "../handlers/errorHandlers.js";

import gameHandlers from "../handlers/DNDGameHandlers.js";

const getGameById = async (req, res) => {
  const gameId = req.params.id;
  const { page, limit } = req.query;
  try {
    const result = await gameHandlers.getGameById(gameId, req.user._id, {
      page,
      limit,
    });
    return res.status(200).send(result);
  } catch (error) {
    return errorReturn(res, error);
  }
};

const getCharacterByGameId = async (req, res) => {
  const gameId = req.params.id;
  try {
    const character = await gameHandlers.getCharacterByGameId(
      gameId,
      req.user._id
    );
    return res.status(200).send({ character });
  } catch (error) {
    return errorReturn(res, error);
  }
};

const getGame = async (req, res) => {
  try {
    const { title } = req.query;
    const games = await gameHandlers.getGame({ title }, req.user._id);
    return res.status(200).send({ games });
  } catch (error) {
    return errorReturn(res, error);
  }
};

const editGameById = async (req, res) => {
  try {
    await gameHandlers.editGameById(
      req.params.id,
      { newTtile: req.body.title, newMemo: req.body.memo },
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
  getCharacterByGameId,
};
