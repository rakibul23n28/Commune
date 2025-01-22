import express from "express";
import { pool } from "../config/database.js"; // Assuming you're using the pool from config
import { validateToken } from "../middleware/auth.js";

const router = express.Router();

// Route to fetch popular posts and events
router.get("/Home", validateToken, async (req, res) => {
  try {
    const sortColumn = req.query.sort || "reviews"; // Default to "reviews" if no sort query
    const order = "DESC"; // You can make this dynamic if needed, currently it's static

    // Query for posts
    const [posts] = await pool.query(`
      SELECT 
        p.post_id AS id,
        p.title,
        p.description,
        p.created_at,
        p.reviews,
        p.reactions,
        c.name AS commune_name,
        c.commune_image
      FROM posts p
      JOIN communes c ON p.commune_id = c.commune_id
      ORDER BY p.${sortColumn} ${order} 
      LIMIT 10
    `);

    // Query for events
    const [events] = await pool.query(`
      SELECT 
        e.event_id AS id,
        e.event_name AS title,
        e.event_description AS description,
        e.event_date AS created_at,
        0 AS reviews, -- Default reviews for events
        0 AS reactions, -- Default reactions for events
        c.name AS commune_name,
        c.commune_image
      FROM events e
      JOIN communes c ON e.commune_id = c.commune_id
      ORDER BY e.event_date DESC
      LIMIT 10
    `);

    res.status(200).json({ success: true, posts, events });
  } catch (error) {
    console.error("Error fetching homepage data:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
