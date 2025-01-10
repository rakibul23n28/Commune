import { pool } from "../config/database.js";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Get current directory path (for ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to create and send JWT
const generateToken = (user) => {
  const payload = {
    id: user.user_id,
    email: user.email,
    joinedDate: user.createdAt,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
  return token;
};

// Get the authenticated user from the token
export const getUser = async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT user_id, username, email, first_name, last_name,  profile_image, is_verified FROM Users WHERE user_id = ?",
      [req.params.id]
    );
    const user = users[0];

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error during user retrieval" });
  }
};
export const updateUser = async (req, res) => {
  const { username, first_name, last_name } = req.body;
  const userId = req.user?.id;
  let profilePicUrl;

  if (!username) {
    return res.status(400).json({ msg: "Please provide a username" });
  }

  try {
    const [users] = await pool.query(
      "SELECT updatedAt, profile_image, username FROM Users WHERE user_id = ?",
      [userId]
    );
    const user = users[0];

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    if (req.file) {
      profilePicUrl = `/uploads/profile_images/${req.file.filename}`;

      // Delete the old profile picture if it exists
      if (user.profile_image) {
        const oldPicPath = path.join(
          __dirname,

          "../../../",
          user.profile_image
        );

        fs.unlink(oldPicPath, (err) => {
          if (err) {
            console.error("Failed to delete old profile picture:", err);
          }
        });
      }
    }

    // Update user in the database
    const [result] = await pool.query(
      "UPDATE Users SET username = ?, first_name = ?, last_name = ?, profile_image = ?, updatedAt = NOW() WHERE user_id = ?",
      [username, first_name, last_name, profilePicUrl, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(400).json({ msg: "Failed to update user" });
    }

    // Fetch updated user data
    const [updatedUserData] = await pool.query(
      "SELECT * FROM Users WHERE user_id = ?",
      [userId]
    );
    const updatedUser = updatedUserData[0];

    // Generate new JWT token
    const token = generateToken(updatedUser);

    res.json({
      msg: "Profile updated successfully",
      token,
      user: {
        id: updatedUser.user_id,
        username: updatedUser.username,
        email: updatedUser.email,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        is_verified: updatedUser.is_verified,
        profile_image: updatedUser.profile_image,
        joinedDate: updatedUser.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error during profile update" });
  }
};

export const getUserByUsername = async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT user_id, username, email, first_name, last_name,  profile_image, is_verified, created_at FROM Users WHERE  username = ?",
      [req.params.username]
    );
    const user = users[0];

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error during user retrieval" });
  }
};