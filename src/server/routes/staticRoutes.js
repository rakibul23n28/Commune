import express from "express";
// import { validateToken } from "../middleware/auth.js";
import { pool } from "../config/database.js";

const router = express.Router();

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

export default router;
