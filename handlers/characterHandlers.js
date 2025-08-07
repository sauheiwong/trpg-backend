import Game from "../models/gameModel.js";
import Character from "../models/COCCharacterModel.js";

import mongoose from "mongoose";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

import { errorStatus } from "./errorHandlers.js";

const getCharacter = async (characterName, userId) => {
  try {
    const query = { userId };
    if (characterName) {
      query["name"] = characterName;
    }
    const characters = await Character.find(query);
    console.log("# of characters is: ", characters.length);
    return characters;
  } catch (error) {
    throw error;
  }
};

export default {
  getCharacter,
};
