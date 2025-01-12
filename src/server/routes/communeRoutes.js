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
  getCommuneUserStatus,
  getJoinedCommunes,
  joinCommune,
  getCommuneReviews,
  setCommuneReview,
  // getCommunesByCommuneId,
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
// router.get("/communes/c/:communeid", getCommunesByCommuneId);
router.get("/joined/:userId", validateToken, getJoinedCommunes);
router.post("/:communeId/join", validateToken, joinCommune);
router.get("/communes/:communeid", getUserCommunesByCommuneId);
router.get("/:commune_id/reviews", getCommuneReviews);
// Route to add a review to a commune
router.post("/:communeid/reviews", validateToken, setCommuneReview);
router.get("/:username", getUserCommunes);

router.delete("/delete/:communeid", validateToken, deleteCommune);

// Route: GET /api/commune/:communeId/:userId
router.get("/membership/:communeId/:userId", getCommuneUserStatus);

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
