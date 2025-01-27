import express from "express";
// import { validateToken } from "../middleware/auth.js";
import { pool } from "../config/database.js";

const router = express.Router();

import multer from "multer";
import path from "path";

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define the folder where images will be stored
    cb(null, "uploads/images"); // Store in 'uploads' folder
  },
  filename: (req, file, cb) => {
    // Use a unique name for the file
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const extension = path.extname(file.originalname); // Get file extension
    cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Only accept image files
    const allowedMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/jpg",
      "image/jfif",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

// POST route for uploading images
router.post("/upload-image", upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Construct the public URL for the uploaded image
    const imageUrl = `/uploads/images/${req.file.filename}`;
    res.status(200).json({ imageUrl });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Image upload failed", error: error.message });
  }
});

router.get("/", (req, res) => {
  return res.status(200).json({ message: "Hello World!" });
});

// GET /products - Fetch all products with commune name and image
router.get("/products", async (req, res) => {
  try {
    const query = `
      SELECT 
        p.product_id,
        p.product_name,
        p.user_id,
        p.description,
        p.product_image,
        p.price,
        p.created_at,
        c.commune_id,
        c.name,
        c.commune_image
      FROM products p
      INNER JOIN communes c ON p.commune_id = c.commune_id
      ORDER BY p.created_at DESC;
    `;

    const [results] = await pool.execute(query);
    res.status(200).json({ products: results });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

//search
router.get("/search", async (req, res) => {
  const searchQuery = req.query.query;

  if (!searchQuery) {
    return res.status(400).json({ message: "Search query is required" });
  }

  const searchSQL = `
    SELECT c.*, 
           COUNT(cr.review_id) OVER (PARTITION BY c.commune_id) AS review_count,
           AVG(cr.rating) OVER (PARTITION BY c.commune_id) AS avg_rating,
           cm.total_joined_users
    FROM communes c
    LEFT JOIN commune_reviews cr ON c.commune_id = cr.commune_id
    LEFT JOIN (
        SELECT commune_id, COUNT(membership_id) AS total_joined_users
        FROM commune_memberships
        WHERE join_status = 'approved'
        GROUP BY commune_id
    ) cm ON c.commune_id = cm.commune_id
    WHERE c.name LIKE ? OR c.description LIKE ? OR c.location LIKE ?
  `;

  const searchValues = [
    `%${searchQuery}%`,
    `%${searchQuery}%`,
    `%${searchQuery}%`,
  ];

  try {
    const [results] = await pool.query(searchSQL, searchValues);
    res.json({ communes: results });
  } catch (err) {
    console.error("Error searching communes:", err);
    res.status(500).json({ message: "Error searching communes" });
  }
});

export default router;
