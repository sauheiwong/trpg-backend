import Game from "../models/gameModel.js";
import Character from "../models/characterModel.js";

import mongoose from "mongoose";
import createDOMPurify from "dompurify";
import { JSDOM } from "jsdom";

import { errorStatus } from "./errorHandlers.js";

const createCharacter = async (userId) => {
  try {
    const newCharacter = await Character.create({ userId });
    return newCharacter;
  } catch (error) {
    return errorStatus(500, error);
  }
};

export default {
  createCharacter,
};
