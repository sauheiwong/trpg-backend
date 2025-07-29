import characterHandlers from "../handlers/characterHandlers.js";

import { errorReturn } from "../handlers/errorHandlers.js";

const createCharacter = async (req, res) => {
  try {
    const newCharacter = await characterHandlers.createCharacter(
      req.body,
      req.user._id
    );
    return res.status(200).send({ characterId: newCharacter._id });
  } catch (error) {
    return errorReturn(res, error);
  }
};

const getCharacterById = async (req, res) => {
  try {
    const characterId = req.params.id;
    const character = await characterHandlers.getCharacterById(characterId);

    return res.status(200).send({ character });
  } catch (error) {
    return errorReturn(res, error);
  }
};

export default {
  createCharacter,
  getCharacterById,
};
