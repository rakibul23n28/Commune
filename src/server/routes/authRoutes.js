import express from "express";
import {
  login,
  register,
  logout,
  validate,
  existUsername,
  verifyAccount,
  socialRegister,
} from "../controllers/authController.js";
import { validateToken } from "../middleware/auth.js";
import { GoogleLogin } from "@react-oauth/google";

const router = express.Router();

router.get("/validate", validateToken, validate);
router.get("/exists/:username", existUsername);
// Google Login Route
// POST /api/auth/social-register
router.post("/social-register", socialRegister);

router.post("/login", login);
router.post("/register", register);
router.post("/logout", logout);
router.post("/verify", verifyAccount);

export default router;
