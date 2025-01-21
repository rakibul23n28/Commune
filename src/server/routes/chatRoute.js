import express from "express";
import { pool } from "../config/database.js";

import { validateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/my-chats", validateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch individual chats
    const [individualChats] = await pool.query(
      `SELECT ic.chat_id, u.username AS chat_name, u.user_id AS user_id, u.profile_image 
       FROM individual_chats ic
       JOIN users u ON (u.user_id = CASE WHEN ic.user_id_1 = ? THEN ic.user_id_2 ELSE ic.user_id_1 END)
       WHERE ic.user_id_1 = ? OR ic.user_id_2 = ?`,
      [userId, userId, userId]
    );

    // Fetch communes with user roles
    const [communes] = await pool.query(
      `SELECT c.commune_id, c.name, cm.role, c.commune_image, ch.chat_id
       FROM commune_memberships cm
       JOIN communes c ON cm.commune_id = c.commune_id
       JOIN chats ch ON c.commune_id = ch.commune_id
       WHERE cm.user_id = ?`,
      [userId]
    );

    // Include the role in the response for communes
    const communesWithRole = communes.map((commune) => ({
      commune_id: commune.commune_id,
      name: commune.name,
      role: commune.role,
      commune_image: commune.commune_image,
      chat_id: commune.chat_id, // Include chat_id in the response
    }));

    res.status(200).json({ individualChats, communes: communesWithRole });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get messages for a selected chat
router.get("/messages/:type/:id", validateToken, async (req, res) => {
  const { type, id } = req.params;
  const userId = req.user.id; // Assuming the user ID is extracted from the JWT token

  try {
    let messages = [];

    if (type === "commune") {
      // Fetch messages for a commune chat
      const [rows] = await pool.query(
        `SELECT m.message_id, m.sender_id, m.message_text, m.created_at, u.username , u.profile_image
           FROM messages m
           JOIN users u ON m.sender_id = u.user_id
           WHERE m.chat_id = ? 
           ORDER BY m.created_at ASC`,
        [id]
      );
      messages = rows;
    } else if (type === "individual") {
      // Fetch messages for an individual chat
      const [rows] = await pool.query(
        `SELECT m.message_id, m.sender_id, m.message_text, m.created_at, u.username, u.profile_image
           FROM individual_chat_messages m
           JOIN users u ON m.sender_id = u.user_id
           WHERE m.individual_chat_id = (
             SELECT chat_id 
             FROM individual_chats 
             WHERE (user_id_1 = ? AND user_id_2 = ?) 
                OR (user_id_1 = ? AND user_id_2 = ?)
           )
           ORDER BY m.created_at ASC`,
        [userId, id, id, userId]
      );
      messages = rows;
    } else {
      return res.status(400).json({ error: "Invalid chat type" });
    }

    res.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/send-message", validateToken, async (req, res) => {
  const { userId_to, chatType, message } = req.body;
  const userId = req.user.id;

  try {
    if (chatType === "individual") {
      let chatIdToUse = userId_to;

      const [existingChat] = await pool.query(
        `SELECT chat_id
             FROM individual_chats
             WHERE (user_id_1 = ? AND user_id_2 = ?)
             OR (user_id_1 = ? AND user_id_2 = ?)`,
        [userId, userId_to, userId_to, userId]
      );

      if (existingChat.length > 0) {
        chatIdToUse = existingChat[0].chat_id;
      } else {
        const [result] = await pool.query(
          `INSERT INTO individual_chats (user_id_1, user_id_2)
               VALUES (?, ?)`,
          [userId, userId_to]
        );
        chatIdToUse = result.insertId;
      }

      // Add message
      await pool.query(
        `INSERT INTO individual_chat_messages (individual_chat_id, sender_id, message_text)
           VALUES (?, ?, ?)`,
        [chatIdToUse, userId, message]
      );

      return res.status(200).json({ success: true });
    }

    if (chatType === "commune") {
      const chat_id = userId_to;
      await pool.query(
        `INSERT INTO messages (chat_id, sender_id, message_text)
           VALUES (?, ?, ?)`,
        [chat_id, userId, message]
      );
      return res.status(200).json({ success: true });
    }

    res.status(400).json({ error: "Invalid chat type" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/search", async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ message: "Username is required" });
  }

  try {
    const [users] = await pool.query(
      "SELECT user_id, username,  profile_image FROM users WHERE username LIKE ?",
      [`%${username}%`]
    );
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: "Error searching users", error });
  }
});

export default router;
