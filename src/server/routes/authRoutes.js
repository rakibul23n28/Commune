import express from "express";
import {
  login,
  register,
  logout,
  validate,
  existUsername,
} from "../controllers/authController.js";
import { validateToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.post("/logout", logout);
router.get("/exists/:username", existUsername);

router.get("/validate", validateToken, validate);

export default router;
