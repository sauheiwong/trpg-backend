import userHandler from "../handlers/userHandler.js";
import { body, validationResult } from "express-validator";
import passport from "passport";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const register = async (req, res) => {
  const callback = (err, newUser) => {
    if (err) {
      res.status(200).send({ message: "register success" });
    } else {
      res.status(400).send({ message: "register fail" });
    }
  };

  await userHandler.register({
    username: req.body.username,
    password: req.body.password,
    callback,
  });
};

const login = (req, res, next) => {
  passport.authenticate("local", { session: false }, (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res
        .status(400)
        .send({ message: info ? info.message : "username or password wrong" });
    }
    req.logIn(user, { session: false }, (err) => {
      if (err) {
        return next(err);
      }

      // build a JWT payload
      const payload = { id: user._id, username: user.username };
      const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
        expiresIn: "1h",
      });
      return res.status(200).send({ token: `Bearer ${token}` });
    });
  })(req, res, next);
};

const logout = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
  });
  return res.status(200).send({ message: "logout success" });
};

const validateRegister = [
  body("username").notEmpty().withMessage("Email address is required"),
  body("username").isEmail().withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("confirm-password")
    .isLength({ min: 6 })
    .withMessage("Confirm Password must be at least 6 characters"),
  body("confirm-password")
    .custom((value, { req }) => {
      return value === req.body.password;
    })
    .withMessage("Password does not match Confirm Password"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ error: errors.errors.map((err) => err.msg).join(". ") });
      // req.flash("danger", errors.errors.map((err) => err.msg).join(". "));
      // res.render("register", { title: "Register", flashes: req.flash() });
    } else {
      next();
    }
  },
];

const validateLogin = [
  body("username").notEmpty().withMessage("Email address is required"),
  body("username").isEmail().withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .send({ error: errors.errors.map((err) => err.msg).join(". ") });
      // req.flash("danger", "⚠️" + errors.errors.map((err) => err.msg).join("."));
      // res.render("login", { title: "Login", flashes: req.flash() });
    } else {
      next();
    }
  },
];

const getUser = async (req, res) => {
  return res.status(200).send({ username: req.user.username });
};

export default {
  register,
  login,
  logout,
  validateLogin,
  validateRegister,
  getUser,
};
