import express from "express";

import multer from "multer";
import { body } from "express-validator";

import {
  createCommune,
  getUserCommunes,
  getUserCommunesByCommuneId,
  updateCommune,
  getAllCommunes,
  deleteCommune,
} from "../controllers/communeController.js";

import { validateToken } from "../middleware/auth.js";

import path from "path";

const router = express.Router();

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/commune_images/"); // Folder where the file will be stored
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // Get file extension
    cb(null, req.user.id + "-" + Date.now() + ext); // Custom file naming
  },
});

// Multer middleware for single file upload
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpeg, png, jpg, gif)"));
    }
  },
}).single("commune_image");

router.post(
  "/create",
  validateToken,
  upload,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("content").notEmpty().withMessage("Content is required"),
  ],
  createCommune
);

// Example route for fetching user's communes
router.get("/all", getAllCommunes);
router.get("/:username", getUserCommunes);
router.get("/communes/:communeid", getUserCommunesByCommuneId);

router.put(
  "/:communeid",
  validateToken,
  upload,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("content").notEmpty().withMessage("Content is required"),
  ],
  updateCommune
);

export default router;
