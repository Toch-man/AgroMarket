const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authController = require("../controllers/authController.js");
const { verifyToken } = require("../middleware/auth");

const signupValidation = [
  body("username").trim().isLength({ min: 3, max: 30 }),
  body("email").isEmail().normalizeEmail(),
  body("password").isLength({ min: 6 }),
  body("role").isIn(["Buyer", "Farmer"]),
];

const loginValidation = [
  body("email").isEmail().normalizeEmail(),
  body("password").notEmpty(),
];

router.post("/signup", signupValidation, authController.signup);
router.post("/login", loginValidation, authController.login);
router.post("/refresh", authController.refreshToken);
router.post("/logout", verifyToken, authController.logout);
router.get("/me", verifyToken, authController.getCurrentUser);

module.exports = router;
