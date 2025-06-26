import { Router } from "express";
import { catchErrors } from "../handlers/errorHandlers.js";

import userController from "../controllers/userController.js";
import gameTestController from "../controllers/gameTestController.js";
import conversationController from "../controllers/conversationController.js";

import requireLogin from "../middleware/requireLogin.js";

export const router = Router();

// register
router.post(
  "/register",
  userController.validateRegister,
  userController.register
);

// login and logout
router.post("/login", userController.validateLogin, userController.login);
router.get("/logout", userController.logout);

// user test
router.get("/user", requireLogin.isAuthenticated, userController.getUser);

// small game test
router.get(
  "/test/chat/",
  requireLogin.isAuthenticated,
  gameTestController.chatWithQwenNew
);
router.get(
  "/test/chat/:id",
  requireLogin.isAuthenticated,
  gameTestController.chatWithQwen
);

// conversation
router.get(
  "/chat/:id",
  requireLogin.isAuthenticated,
  conversationController.getConservationById
);
