import express from "express";
import multer from "multer"; // Import multer
import {
  getUser,
  updateUser,
  getUserByUsername,
} from "../controllers/userController.js";
import { validateToken } from "../middleware/auth.js";
import path from "path";

// Set up Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profile_images/"); // Folder where the file will be stored
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, req.user.id + "-" + Date.now() + ext);
  },
});

// Create Multer instance with storage configuration
const upload = multer({ storage: storage });

const router = express.Router();

// Routes
router.put(
  "/update",
  validateToken,
  upload.single("profile_image"),
  updateUser
);
router.get("/profile/:username", getUserByUsername);
router.get("/:id", getUser);

// Add the multer middleware to handle file upload on the /update route

export default router;
