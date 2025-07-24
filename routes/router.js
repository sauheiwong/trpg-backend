import { Router } from "express";
import { catchErrors } from "../handlers/errorHandlers.js";
import passport from "passport";

import userController from "../controllers/userController.js";
import gameController from "../controllers/gameController.js";
import geminiController from "../controllers/geminiController.js";
import rollDiceController from "../controllers/rollDiceController.js";

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
router.get("/api/game", requireAuth, gameController.getGame);

router.get("/api/game/:id", requireAuth, gameController.getGameById);

router.put("/api/game/:id", requireAuth, gameController.editGameById);

router.delete("/api/game/:id", requireAuth, gameController.deleteGameById);
