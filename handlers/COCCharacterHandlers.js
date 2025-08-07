import COCCharacter from "../models/COCCharacterModel.js";

const getCharacterById = async (characterId) => {
  try {
    return await COCCharacter.findById(characterId);
  } catch (error) {
    return error;
  }
};

export default {
  getCharacterById,
};
