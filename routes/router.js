import { Router } from "express";
import passport from "passport";

import userController from "../controllers/userController.js";
import gameCOCController from "../controllers/gameCOCController.js";
import geminiController from "../controllers/geminiCOCController.js";
// import geminiCharacterController from "../controllers/geminiCOCCharacterController.js";
import rollDiceController from "../controllers/rollDiceController.js";
import COCCharacterController from "../controllers/COCCharacterController.js";
// import characterChatController from "../controllers/characterChatController.js";

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
router.get("/api/gemini", requireAuth, geminiController.chatWithGeminiNew);

router.post(
  "/api/gemini/:id",
  requireAuth,
  geminiController.chatWithGeminiById
);

// router.get(
//   "/api/gemini/characters",
//   requireAuth,
//   geminiCharacterController.chatWithGeminiNew
// );

// router.post(
//   "/api/gemini/characters/:id",
//   requireAuth,
//   geminiCharacterController.chatWithGeminiById
// );

// coc character
router.get(
  "/api/coc/characters",
  requireAuth,
  COCCharacterController.getCharacter
);

// character chat
// router.get(
//   "/api/chat/characters/:id",
//   requireAuth,
//   characterChatController.getChatById
// );

// // small game test
// router.post("/api/test/chat", requireAuth, gameTestController.chatWithQwenNew);
// router.post(
//   "/api/test/chat/:id",
//   requireAuth,
//   gameTestController.chatInConservationById
// );

// roll dice
router.post("/api/roll", requireAuth, rollDiceController.rollDice);

// game
router.get("/api/game", requireAuth, gameCOCController.getGame);

router.get("/api/game/:id", requireAuth, gameCOCController.getGameById);

router.get(
  "/api/game/character/:id",
  requireAuth,
  gameCOCController.getCharacterByGameId
);

router.put("/api/game/:id", requireAuth, gameCOCController.editGameById);

router.delete("/api/game/:id", requireAuth, gameCOCController.deleteGameById);
