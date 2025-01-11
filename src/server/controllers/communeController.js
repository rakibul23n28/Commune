import { pool } from "../config/database.js";
import { validationResult } from "express-validator";

export const createCommune = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, content, location, commune_type, privacy } =
    req.body;
  const image = `/uploads/commune_images/${req.file.filename}`;

  const admin_id = req.user.id;

  try {
    // Start a transaction
    await pool.query("START TRANSACTION");

    // Insert the new commune
    const [result] = await pool.query(
      `INSERT INTO communes (name, commune_image, description, content, location, commune_type, admin_id, privacy) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        image,
        description,
        content,
        location,
        commune_type,
        admin_id,
        privacy,
      ]
    );

    const commune_id = result.insertId;

    // Add the creator as the admin in the memberships table
    await pool.query(
      `INSERT INTO commune_memberships (commune_id, user_id, role) VALUES (?, ?, 'admin')`,
      [commune_id, admin_id]
    );

    // Commit the transaction
    await pool.query("COMMIT");

    res.status(201).json({ commune_id });
  } catch (err) {
    console.error(err);

    // Rollback the transaction in case of error
    await pool.query("ROLLBACK");
    res.status(500).json({ message: "Database error" });
  }
};

export const getUserCommunes = async (req, res) => {
  const { username } = req.params;

  try {
    const [result] = await pool.query(
      `SELECT * FROM communes WHERE admin_id = (SELECT user_id FROM users WHERE username = ?)`,
      [username]
    );
    res.json({ communes: result });
  } catch (err) {
    console.error("Failed to fetch communes:", err);
    res.status(500).json({ message: "Error fetching communes" });
  }
};

export const getUserCommunesByCommuneId = async (req, res) => {
  const { communeid } = req.params;

  try {
    const [result] = await pool.query(
      `SELECT * FROM communes WHERE commune_id = ?`,
      [communeid]
    );

    res.json({ communes: result[0] });
  } catch (err) {
    console.error("Failed to fetch communes:", err);
    res.status(500).json({ message: "Error fetching communes" });
  }
};

import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { dirname } from "path";

// Get current directory path (for ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const updateCommune = async (req, res) => {
  const { name, description, content, location, commune_type, privacy } =
    req.body;
  const communeId = req.params.communeid;
  let communeImageUrl;

  if (!name) {
    return res.status(400).json({ msg: "Please provide a commune name" });
  }

  try {
    // Fetch existing commune details
    const [communes] = await pool.query(
      "SELECT commune_image FROM Communes WHERE commune_id = ?",
      [communeId]
    );
    const commune = communes[0];

    if (!commune) {
      return res.status(404).json({ msg: "Commune not found" });
    }

    // Handle file upload for the new image
    if (req.file) {
      communeImageUrl = `/uploads/commune_images/${req.file.filename}`;

      // Delete the old commune image if it exists
      if (commune.commune_image) {
        const oldImagePath = path.join(
          __dirname,
          "../../../",
          commune.commune_image
        );

        fs.unlink(oldImagePath, (err) => {
          if (err) {
            console.error("Failed to delete old commune image:", err);
          }
        });
      }
    } else {
      communeImageUrl = commune.commune_image; // Keep the old image if no new image is uploaded
    }

    // Update commune details in the database
    const [result] = await pool.query(
      "UPDATE Communes SET name = ?, description = ?, content = ?, location = ?, commune_type = ?, privacy = ?, commune_image = ?, updated_at = NOW() WHERE commune_id = ?",
      [
        name,
        description,
        content,
        location,
        commune_type,
        privacy,
        communeImageUrl,
        communeId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ msg: "Failed to update commune" });
    }

    // Fetch updated commune data
    const [updatedCommuneData] = await pool.query(
      "SELECT * FROM Communes WHERE commune_id = ?",
      [communeId]
    );
    const updatedCommune = updatedCommuneData[0];

    res.json({
      msg: "Commune updated successfully",
      commune: {
        id: updatedCommune.commune_id,
        name: updatedCommune.name,
        description: updatedCommune.description,
        location: updatedCommune.location,
        commune_type: updatedCommune.commune_type,
        privacy: updatedCommune.privacy,
        commune_image: updatedCommune.commune_image,
        updatedAt: updatedCommune.updated_at,
        createdAt: updatedCommune.created_at,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error during commune update" });
  }
};

export const getAllCommunes = async (req, res) => {
  try {
    const [communes] = await pool.query("SELECT * FROM communes");
    res.json({ communes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error during commune retrieval" });
  }
};

export const deleteCommune = async (req, res) => {
  const communeId = req.params.communeid;

  try {
    const [communes] = await pool.query(
      "SELECT commune_image FROM Communes WHERE commune_id = ?",
      [communeId]
    );
    const commune = communes[0];

    if (!commune) {
      return res.status(404).json({ msg: "Commune not found" });
    }

    // Delete the commune image if it exists
    if (commune.commune_image) {
      const imagePath = path.join(
        __dirname,
        "../../../",
        commune.commune_image
      );
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error("Failed to delete commune image:", err);
        }
      });
    }

    // Delete the commune from the database
    const [result] = await pool.query(
      "DELETE FROM Communes WHERE commune_id = ?",
      [communeId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ msg: "Failed to delete commune" });
    }

    res.json({ msg: "Commune deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error during commune deletion" });
  }
};

export const getCommuneUserStatus = async (req, res) => {
  const { communeId, userId } = req.params;

  try {
    // Query to check membership and fetch details
    const [rows] = await pool.query(
      `
      SELECT 
        cm.role, 
        cm.joined_at, 
        c.name AS commune_name, 
        c.privacy
      FROM 
        commune_memberships cm
      JOIN 
        communes c ON cm.commune_id = c.commune_id
      JOIN 
        users u ON cm.user_id = u.user_id
      WHERE 
        cm.commune_id = ? AND cm.user_id = ?
      `,
      [communeId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User is not a member of this commune.",
      });
    }

    // Return the membership details
    res.status(200).json({
      success: true,
      data: {
        role: rows[0].role,
        joined_at: rows[0].joined_at,
        commune: {
          name: rows[0].commune_name,
          privacy: rows[0].privacy,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching membership details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
