import { Router } from "express";
import passport from "passport";

import userController from "../controllers/userController.js";
import gameCOCController from "../controllers/gameCOCController.js";
import gameDNDController from "../controllers/gameDNDController.js";
// import geminiCOCController from "../controllers/geminiCOCController.js";
import geminiDNDController from "../controllers/geminiDNDController.js";
// import geminiCharacterController from "../controllers/geminiCOCCharacterController.js";
import rollDiceController from "../controllers/rollDiceController.js";
// import COCCharacterController from "../controllers/COCCharacterController.js";
// import characterChatController from "../controllers/characterChatController.js";

import summaryTest from "../scripts/COC/summaryTest.js";

export const router = Router();

const requireAuth = passport.authenticate("jwt", { session: false });

// register
router.post(
  "/api/register",
  userController.validateRegister,
  userController.register
);

// login and logout
router.post("/api/login", userController.validateLogin, userController.login);
router.get("/api/logout", userController.logout);

// user setting
router.get("/api/user", requireAuth, userController.getUser);

router.put("/api/user", requireAuth, userController.editUser);

// gemini

router.get(
  "/api/dnd/gemini",
  requireAuth,
  geminiDNDController.chatWithGeminiNew
);

router.post(
  "/api/dnd/gemini/:id",
  requireAuth,
  geminiDNDController.chatWithGeminiById
);

// roll dice
router.post("/api/roll", requireAuth, rollDiceController.rollDice);

// COCgame
router.get("/api/game", requireAuth, gameCOCController.getGame);

router.get("/api/game/:id", requireAuth, gameCOCController.getGameById);

// router.get("/api/game/test/characterUpdate/:id", requireAuth, COCTestController.characterUpdate)

router.get("/api/game/test/summary", requireAuth, summaryTest.summaryTest)

// router.get(
//   "/api/coc/characters",
//   requireAuth,
//   gameCOCController.getAvailableCharacter
// );

// router.get(
//   "/api/game/character/:id",
//   requireAuth,
//   gameCOCController.getCharacterByGameId
// );

router.put("/api/game/:id", requireAuth, gameCOCController.editGameById);

router.delete("/api/game/:id", requireAuth, gameCOCController.deleteGameById);

// DNDgame

router.get("/api/dnd/game", requireAuth, gameDNDController.getGame);

router.get("/api/dnd/game/:id", requireAuth, gameDNDController.getGameById);

router.put("/api/dnd/game/:id", requireAuth, gameDNDController.editGameById);

router.delete(
  "/api/dnd/game/:id",
  requireAuth,
  gameDNDController.deleteGameById
);
