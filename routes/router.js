import { Router } from "express";
import { catchErrors } from "../handlers/errorHandlers.js";
import passport from "passport";

import userController from "../controllers/userController.js";
import gameTestController from "../controllers/gameTestController.js";
import gameController from "../controllers/gameController.js";
import geminiController from "../controllers/geminiController.js";

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
router.get("/user", requireAuth, userController.getUser);

// gemini
router.get("/api/gemini", requireAuth, geminiController.chatWithGeminiNew)

router.post("/api/gemini/:id", requireAuth, geminiController.chatWithGeminiById)

// small game test
router.post("/api/test/chat", requireAuth, gameTestController.chatWithQwenNew);
router.post(
  "/api/test/chat/:id",
  requireAuth,
  gameTestController.chatInConservationById
);

// game
router.get("/api/chat", requireAuth, gameController.getConservation);

router.get(
  "/api/chat/:id",
  requireAuth,
  gameController.getConservationById
);

router.put(
  "/api/chat/:id",
  requireAuth,
  gameController.editConservationById
);

router.delete(
  "/api/chat/:id",
  requireAuth,
  gameController.deleteConservationById
);
