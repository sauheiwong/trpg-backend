import characterHandlers from "../handlers/characterHandlers.js";

import { errorReturn } from "../handlers/errorHandlers.js";

const getCharacterById = async (req, res) => {
  try {
    const characterId = req.params.id;
    const character = await characterHandlers.getCharacterById(characterId);

    return res.status(200).send({ character });
  } catch (error) {
    return errorReturn(res, error);
  }
};

const getCharacter = async (req, res) => {
  try {
    const { characterName } = req.query;
    console.log("characterName is: ", characterName);
    const characters = await characterHandlers.getCharacter(
      characterName,
      req.user._id
    );

    return res.status(200).send({ characters });
  } catch (error) {
    return errorReturn(res, error);
  }
};

export default {
  getCharacterById,
  getCharacter,
};
