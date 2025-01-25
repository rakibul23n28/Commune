import { pool } from "../config/database.js";

export const makeReaction = async (req, res) => {
  const { postid } = req.params;
  const { reaction_type } = req.body;
  const userId = req.user.id; // Assuming JWT contains user ID

  // Validate reaction_type
  if (!["like", "hate"].includes(reaction_type)) {
    return res.status(400).json({ message: "Invalid reaction type." });
  }

  try {
    // Check if the user has already reacted to this post
    const [existingReaction] = await pool.query(
      "SELECT * FROM reactions WHERE post_id = ? AND user_id = ?",
      [postid, userId]
    );

    if (existingReaction.length > 0) {
      // Update existing reaction
      await pool.query(
        "UPDATE reactions SET reaction_type = ? WHERE post_id = ? AND user_id = ?",
        [reaction_type, postid, userId]
      );
      //count reaction
      const [countLike] = await pool.query(
        "SELECT COUNT(*) AS reaction_count FROM reactions WHERE post_id = ? AND reaction_type = 'like'",
        [postid]
      );
      const [countHate] = await pool.query(
        "SELECT COUNT(*) AS reaction_count FROM reactions WHERE post_id = ? AND reaction_type = 'hate'",
        [postid]
      );

      return res.json({
        message: "Reaction updated successfully.",
        update: true,
        reaction_count: {
          like: countLike[0].reaction_count,
          hate: countHate[0].reaction_count,
        },
      });
    }

    // Add new reaction if none exists
    await pool.query(
      "INSERT INTO reactions (post_id, user_id, reaction_type) VALUES (?, ?, ?)",
      [postid, userId, reaction_type]
    );
    // count reaction
    const [reactionCount] = await pool.query(
      "SELECT COUNT(*) AS reaction_count FROM reactions WHERE post_id = ?",
      [postid]
    );

    res.status(201).json({
      message: "Reaction added successfully.",
      update: false,
      reaction_count: reactionCount[0].reaction_count,
    });
  } catch (error) {
    console.error("Error handling reaction:", error);
    res.status(500).json({ message: "Server error." });
  }
};

export const getComments = async (req, res) => {
  const postid = req.params.postid;

  try {
    const [comments] = await pool.query(
      `
      SELECT 
        c.comment_id,
        c.content,
        c.created_at,
        u.user_id,
        u.username,
        u.profile_image
      FROM comments c
      JOIN users u ON c.user_id = u.user_id
      WHERE c.post_id = ?
      ORDER BY c.created_at DESC
      `,
      [postid]
    );

    res.json({ comments });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Server error." });
  }
};
export const newComment = async (req, res) => {
  const { postid } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ message: "Content cannot be empty" });
  }

  try {
    // Insert comment into the database
    const [result] = await pool.query(
      "INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)",
      [postid, userId, content]
    );

    if (!result.insertId) {
      return res
        .status(500)
        .json({ message: "Failed to retrieve comment ID." });
    }

    // Retrieve the inserted comment and user details
    const [comment] = await pool.query(
      `
        SELECT 
          c.comment_id,
          c.content,
          c.created_at,
          u.user_id,
          u.username,
          u.profile_image
        FROM comments c
        JOIN users u ON c.user_id = u.user_id
        WHERE c.comment_id = ?
      `,
      [result.insertId]
    );

    if (comment.length === 0) {
      return res.status(404).json({ message: "Comment not found." });
    }

    // Respond with the newly added comment
    res.status(201).json({
      message: "Comment added successfully!",
      comment: comment[0], // Send the first (and only) comment
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res
      .status(500)
      .json({ message: "Failed to add comment. Please try again." });
  }
};
