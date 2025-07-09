import { Router } from "express";
import { catchErrors } from "../handlers/errorHandlers.js";
import passport from "passport";

import userController from "../controllers/userController.js";
import gameTestController from "../controllers/gameTestController.js";
import conversationController from "../controllers/conversationController.js";

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

// user test
router.get("/user", requireAuth, userController.getUser);

// small game test
router.post("/api/test/chat", requireAuth, gameTestController.chatWithQwenNew);
router.post(
  "/api/test/chat/:id",
  requireAuth,
  gameTestController.chatInConservationById
);

// conversation
router.get("/api/chat", requireAuth, conversationController.getConservation);

router.get(
  "/api/chat/:id",
  requireAuth,
  conversationController.getConservationById
);

router.put(
  "/api/chat/:id",
  requireAuth,
  conversationController.editConservationById
);
