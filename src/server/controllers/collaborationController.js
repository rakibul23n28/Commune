import { pool } from "../config/database.js";

export const collaborationPost = async (req, res) => {
  const { commune_id_1, commune_id_2, post_id } = req.body;

  try {
    // Check if a similar collaboration already exists
    const [existingCollaboration] = await pool.query(
      "SELECT * FROM collaborations_post WHERE commune_id_1 = ? AND commune_id_2 = ? AND post_id = ?",
      [commune_id_1, commune_id_2, post_id]
    );

    if (existingCollaboration.length !== 0) {
      return res.status(400).json({ message: "Collaboration already exists." });
    }

    // Insert the new collaboration
    await pool.query(
      "INSERT INTO collaborations_post (commune_id_1, commune_id_2, post_id) VALUES (?, ?, ?)",
      [commune_id_1, commune_id_2, post_id]
    );

    res.status(201).json({ message: "Collaboration request created." });
  } catch (error) {
    console.error("Error creating collaboration:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const collaborationEvent = async (req, res) => {
  const { commune_id_1, commune_id_2, event_id } = req.body;

  try {
    // Check if a similar collaboration already exists
    const [existingCollaboration] = await pool.query(
      "SELECT * FROM collaborations_event WHERE commune_id_1 = ? AND commune_id_2 = ? AND event_id = ?",
      [commune_id_1, commune_id_2, event_id]
    );

    if (existingCollaboration.length !== 0) {
      return res.status(400).json({ message: "Collaboration already exists." });
    }

    // Insert the new collaboration
    await pool.query(
      "INSERT INTO collaborations_event (commune_id_1, commune_id_2, event_id) VALUES (?, ?, ?)",
      [commune_id_1, commune_id_2, event_id]
    );

    res.status(201).json({ message: "Collaboration request created." });
  } catch (error) {
    console.error("Error creating collaboration:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
export const getCollaborationPosts = async (req, res) => {
  const { communeid } = req.params;

  try {
    // Fetch the collaborations for the given commune
    const [collaborations] = await pool.query(
      "SELECT post_id FROM collaborations_post WHERE collaboration_status = 'accepted' AND commune_id_2 = ?",
      [communeid]
    );

    if (collaborations.length === 0) {
      return res.status(404).json({ message: "No collaborations found." });
    }

    // Extract post IDs from collaborations
    const postIds = collaborations.map(
      (collaboration) => collaboration.post_id
    );

    // Fetch the post details along with like, hate, and comment counts
    const [posts] = await pool.query(
      `SELECT 
        posts.post_id, 
        posts.title, 
        posts.content, 
        posts.links, 
        posts.tags, 
        posts.created_at, 
        users.username, 
        users.profile_image, 
        COALESCE(SUM(CASE WHEN reactions.reaction_type = 'like' THEN 1 ELSE 0 END), 0) AS likes,
        COALESCE(SUM(CASE WHEN reactions.reaction_type = 'hate' THEN 1 ELSE 0 END), 0) AS hates,
        (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.post_id) AS comments
      FROM posts 
      JOIN users ON posts.user_id = users.user_id
      LEFT JOIN reactions ON posts.post_id = reactions.post_id
      WHERE posts.post_type = 'blog' AND posts.post_id IN (?)
      GROUP BY posts.post_id`,
      [postIds]
    );

    // Convert likes, hates, and comments_count to numbers
    posts.forEach((post) => {
      post.likes = Number(post.likes);
      post.hates = Number(post.hates);
      post.comments_count = Number(post.comments_count);
    });

    res.status(200).json({ posts });
  } catch (error) {
    console.error("Error fetching collaborations:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const getCollaborationEvents = async (req, res) => {
  const { communeid } = req.params;

  try {
    const query = `
        SELECT 
          ce.collaboration_id,
          ce.event_id,
          ce.collaboration_status,
          e.event_name,
          e.event_date,
          e.event_description,
          e.created_by,
          c1.name AS collaborating_commune_name,
          c1.commune_id AS collaborating_commune_id,
          c1.commune_image AS collaborating_commune_image
        FROM collaborations_event ce
        JOIN communes c1 ON ce.commune_id_1 = c1.commune_id
        JOIN events e ON ce.event_id = e.event_id
        WHERE ce.collaboration_status = 'accepted' AND ce.commune_id_2 = ?
  
        ORDER BY e.event_date DESC;
      `;

    const [results] = await pool.query(query, [communeid]);

    res.status(200).json({ success: true, collaborativeEvents: results });
  } catch (error) {
    console.error("Error fetching collaborative events:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch collaborative events. Please try again.",
    });
  }
};

export const getCollaborationLists = async (req, res) => {
  const { communeid } = req.params;

  try {
    const [collaborations] = await pool.query(
      "SELECT commune_id_1 FROM collaborations_post WHERE collaboration_status = 'accepted' AND commune_id_2 = ?",
      [communeid]
    );
    const uniqueCommuneIds = Array.from(
      new Set(collaborations.map((c) => c.commune_id_1))
    );

    if (uniqueCommuneIds.length === 0) {
      return res
        .status(404)
        .json({ message: "No posts found for collaborations." });
    }

    // Fetch posts for the unique commune IDs, including reactions and comments
    const [posts] = await pool.query(
      `SELECT 
        posts.post_id,
        posts.title,
        posts.content,
        posts.links,
        posts.tags,
        posts.created_at,
        users.username,
        users.profile_image,
        COALESCE(SUM(CASE WHEN reactions.reaction_type = 'like' THEN 1 ELSE 0 END), 0) AS likes,
        COALESCE(SUM(CASE WHEN reactions.reaction_type = 'hate' THEN 1 ELSE 0 END), 0) AS hates,
        (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.post_id) AS comments
      FROM posts
      JOIN users ON posts.user_id = users.user_id
      LEFT JOIN reactions ON posts.post_id = reactions.post_id
      WHERE posts.post_type = 'listing' AND posts.commune_id IN (?)
      GROUP BY posts.post_id`,
      [uniqueCommuneIds]
    );

    if (posts.length === 0) {
      return res
        .status(404)
        .json({ message: "No posts found for collaborations." });
    }

    const listings = await Promise.all(
      posts.map(async (post) => {
        const [attributes] = await pool.query(
          "SELECT attributes FROM post_attributes WHERE post_id = ?",
          [post.post_id]
        );

        const parsedAttributes = attributes.map((attr) => {
          if (typeof attr.attributes === "string") {
            return JSON.parse(attr.attributes);
          }
          return attr.attributes;
        });

        const columns = parsedAttributes.map((attr) => ({
          attribute_name: attr.attribute_name || "Unnamed Attribute",
          attribute_type: attr.attribute_type || "Unknown Type",
        }));

        const rows = parsedAttributes.map((attr) => ({
          [attr.attribute_name]: Array.isArray(attr.attribute_value)
            ? attr.attribute_value.join(", ")
            : attr.attribute_value || "No Value",
        }));

        return {
          metaData: {
            title: post.title,
            description: post.content,
            links: post.links,
            tags: post.tags,
            post_id: post.post_id,
            user_id: post.user_id,
            username: post.username,
            profile_image: post.profile_image,
            created_at: post.created_at,
            likes: Number(post.likes),
            hates: Number(post.hates),
            comments: Number(post.comments),
          },
          columns,
          rows,
        };
      })
    );

    res.status(200).json(listings);
  } catch (error) {
    console.error("Error fetching collaboration lists:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const deleteCollaborationPost = async (req, res) => {
  const { postid } = req.params;

  try {
    await pool.query("DELETE FROM collaborations_post WHERE post_id = ?", [
      postid,
    ]);

    res.status(200).json({ message: "Collaboration request deleted." });
  } catch (error) {
    console.error("Error deleting collaboration:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const deleteCollaborationEvent = async (req, res) => {
  const { eventid } = req.params;

  try {
    await pool.query("DELETE FROM collaborations_event WHERE event_id = ?", [
      eventid,
    ]);

    res.status(200).json({ message: "Collaboration request deleted." });
  } catch (error) {
    console.error("Error deleting collaboration:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const changeCollaborationEventStatus = async (req, res) => {
  const { collaborationid } = req.params;
  const { status } = req.body;

  try {
    await pool.query(
      "UPDATE collaborations_event SET collaboration_status = ? WHERE collaboration_id = ?",
      [status, collaborationid]
    );

    res.status(200).json({ message: "Collaboration event status updated." });
  } catch (error) {
    console.error("Error updating collaboration event status:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const changeCollaborationPostStatus = async (req, res) => {
  const { collaborationid } = req.params;
  const { status } = req.body;
  console.log("Collaboration ID:", collaborationid);

  try {
    await pool.query(
      "UPDATE collaborations_post SET collaboration_status = ? WHERE collaboration_id = ?",
      [status, collaborationid]
    );

    res.status(200).json({ message: "Collaboration post status updated." });
  } catch (error) {
    console.error("Error updating collaboration post status:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Function to fetch pending collaborations for posts and events
export const getCollaborationPending = async (req, res) => {
  const { communeid } = req.params;

  try {
    // Fetch pending post collaborations
    const [pendingPosts] = await pool.query(
      `
            SELECT 
                cp.collaboration_id, 
                p.title, 
                p.content AS description,
                p.post_type,
                c1.name AS collaborating_commune_name, 
                c1.commune_image AS collaborating_commune_image,
                c1.commune_id AS collaborating_commune_id,
                cp.created_at
            FROM collaborations_post cp
            JOIN posts p ON cp.post_id = p.post_id
            JOIN communes c1 ON cp.commune_id_2 = c1.commune_id
            WHERE cp.commune_id_1 = ? AND cp.collaboration_status = 'pending'
        `,
      [communeid]
    );

    // Fetch pending event collaborations
    const [pendingEvents] = await pool.query(
      `
            SELECT 
                ce.collaboration_id, 
                e.event_name, 
                e.event_description,
                c1.name AS collaborating_commune_name, 
                c1.commune_image AS collaborating_commune_image, 
                c1.commune_id AS collaborating_commune_id,
                ce.created_at
            FROM collaborations_event ce
            JOIN events e ON ce.event_id = e.event_id
            JOIN communes c1 ON ce.commune_id_2 = c1.commune_id
            WHERE ce.commune_id_1 = ? AND ce.collaboration_status = 'pending'
        `,
      [communeid]
    );

    // Return both pending posts and events
    res.status(200).json({
      pendingPosts,
      pendingEvents,
    });
  } catch (error) {
    console.error("Error fetching pending collaborations:", error);
    res.status(500).json({ message: "Error fetching pending collaborations." });
  }
};

export const getCollaborationRequests = async (req, res) => {
  const { communeid } = req.params;

  try {
    // Query for pending and rejected collaboration requests
    const [Posts] = await pool.query(
      `
      SELECT 
        cp.collaboration_id,
        cp.collaboration_status,
        p.title,
        p.content AS description,
        p.post_type,
        p.post_id,
        c1.name AS collaborating_commune_name,
        c1.commune_image AS collaborating_commune_image,
        cp.created_at,
        cp.updated_at
      FROM collaborations_post cp
      JOIN posts p ON cp.post_id = p.post_id
      JOIN communes c1 ON cp.commune_id_1 = c1.commune_id
      WHERE cp.commune_id_2 = ?
      AND cp.collaboration_status != 'accepted'
      `,
      [communeid]
    );

    const [Events] = await pool.query(
      `
      SELECT 
        ce.collaboration_id,
        ce.collaboration_status,
        e.event_name,
        e.event_description,
        e.event_id,
        c1.name AS collaborating_commune_name,
        c1.commune_image AS collaborating_commune_image,
        ce.created_at,
        ce.updated_at
      FROM collaborations_event ce
      JOIN events e ON ce.event_id = e.event_id
      JOIN communes c1 ON ce.commune_id_1 = c1.commune_id
      WHERE ce.commune_id_2 = ?
      AND ce.collaboration_status != 'accepted'
      `,
      [communeid]
    );

    res.status(200).json({
      posts: Posts,
      events: Events,
    });
  } catch (error) {
    console.error("Error fetching collaboration requests:", error);
    res.status(500).json({
      error: "Unable to fetch collaboration requests. Please try again later.",
    });
  }
};
