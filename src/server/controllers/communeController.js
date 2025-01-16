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
    res.status(500).json({ msg: "Database error" });
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
    res.status(500).json({ msg: "Error fetching communes" });
  }
};

export const getUserCommunesByCommuneId = async (req, res) => {
  const { communeid } = req.params;

  try {
    // Fetch commune details along with reviews and reviewer's profile image
    const [result] = await pool.query(
      `SELECT communes.*, 
              commune_reviews.rating,
              commune_reviews.review_text,
              commune_reviews.created_at AS review_created_at,
              reviewer.username AS reviewer_username,
              reviewer.profile_image AS reviewer_profile_image
       FROM communes
       LEFT JOIN commune_reviews ON communes.commune_id = commune_reviews.commune_id
       LEFT JOIN users AS reviewer ON commune_reviews.user_id = reviewer.user_id
       WHERE communes.commune_id = ?`,
      [communeid]
    );

    const commune = result[0];
    const reviews = result.map((review) => ({
      reviewer_username: review.reviewer_username,
      reviewer_profile_image: review.reviewer_profile_image,
      rating: review.rating,
      review_text: review.review_text,
      created_at: review.review_created_at,
    }));

    res.json({ commune: commune, reviews: reviews });
  } catch (err) {
    console.error("Failed to fetch commune data:", err);
    res.status(500).json({ msg: "Error fetching commune data" });
  }
};

// export const getCommunesByCommuneId = async (req, res) => {
//   const { communeid } = req.params;

//   try {
//     const [result] = await pool.query(
//       `SELECT * FROM communes WHERE commune_id = ?`,
//       [communeid]
//     );

//     res.json({ commune: result[0] });
//   } catch (err) {
//     console.error("Failed to fetch communes:", err);
//     res.status(500).json({ message: "Error fetching communes" });
//   }
// };

import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";
import { dirname } from "path";
import { log } from "util";

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
    // Query to get communes along with review count, average rating, and total joined users
    const query = `
      SELECT c.*, 
            COUNT(cr.review_id) OVER (PARTITION BY c.commune_id) AS review_count,
            AVG(cr.rating) OVER (PARTITION BY c.commune_id) AS avg_rating,
            cm.total_joined_users
      FROM communes c
      LEFT JOIN commune_reviews cr ON c.commune_id = cr.commune_id
      LEFT JOIN (
          SELECT commune_id, COUNT(membership_id) AS total_joined_users
          FROM commune_memberships
          GROUP BY commune_id
      ) cm ON c.commune_id = cm.commune_id;
    `;

    const [communesWithDetails] = await pool.query(query);

    // If no communes found
    if (communesWithDetails.length === 0) {
      return res.status(404).json({ msg: "No communes found" });
    }

    // Group communes with their review count, average rating, and total joined users
    const communes = [];
    communesWithDetails.forEach((row) => {
      let commune = communes.find((c) => c.commune_id === row.commune_id);
      if (!commune) {
        commune = { ...row }; // Copy commune data
        commune.review_count = row.review_count; // Set the review count for the commune
        commune.avg_rating = row.avg_rating; // Set the average rating for the commune
        commune.total_joined_users = row.total_joined_users; // Set the total joined users for the commune
        communes.push(commune);
      }
    });

    res.status(200).json({ communes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error during commune retrieval" });
  }
};
// // Get all communes with review count, average rating, and total joined users
// export const getAllCommunes = async (req, res) => {
//   try {
//     // Query to get communes along with reviews, user details, review count, average rating, and total joined users
//     const query = `
//       SELECT c.*,
//             cr.review_id, cr.rating, cr.review_text, cr.created_at,
//             u.username, u.profile_image,
//             COUNT(cr.review_id) OVER (PARTITION BY c.commune_id) AS review_count,
//             AVG(cr.rating) OVER (PARTITION BY c.commune_id) AS avg_rating,
//             cm.total_joined_users
//       FROM communes c
//       LEFT JOIN commune_reviews cr ON c.commune_id = cr.commune_id
//       LEFT JOIN users u ON cr.user_id = u.user_id
//       LEFT JOIN (
//           SELECT commune_id, COUNT(membership_id) AS total_joined_users
//           FROM commune_memberships
//           GROUP BY commune_id
//       ) cm ON c.commune_id = cm.commune_id;
//     `;

//     const [communesWithReviews] = await pool.query(query);
//     console.log(communesWithReviews);

//     // If no communes found
//     if (communesWithReviews.length === 0) {
//       return res.status(404).json({ msg: "No communes found" });
//     }

//     // Group communes with their reviews, review count, average rating, and total joined users
//     const communes = [];
//     communesWithReviews.forEach((row) => {
//       let commune = communes.find((c) => c.commune_id === row.commune_id);
//       if (!commune) {
//         commune = { ...row }; // Copy commune data
//         commune.reviews = [];
//         commune.review_count = row.review_count; // Set the review count for the commune
//         commune.avg_rating = row.avg_rating; // Set the average rating for the commune
//         commune.total_joined_users = row.total_joined_users; // Set the total joined users for the commune
//         communes.push(commune);
//       }

//       // If there's a review for this commune, add it to the reviews array
//       if (row.review_id) {
//         commune.reviews.push({
//           review_id: row.review_id,
//           rating: row.rating,
//           review_text: row.review_text,
//           created_at: row.created_at,
//           username: row.username,
//           profile_image: row.profile_image,
//         });
//       }
//     });

//     res.status(200).json({ communes });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ msg: "Server error during commune retrieval" });
//   }
// };
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

    res.json({ msg: "Commune deleted successfully", success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error during commune deletion" });
  }
};

export const getCommuneSmallInfo = async (req, res) => {
  const communeId = req.params.communeid;

  try {
    const [communes] = await pool.query(
      "SELECT commune_id, name, commune_image FROM Communes WHERE commune_id = ?",
      [communeId]
    );

    if (communes.length === 0) {
      return res.status(404).json({ msg: "Commune not found" });
    }

    const commune = communes[0];

    res.status(200).json({
      success: true,
      commune: commune,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error during commune retrieval" });
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
        msg: "User is not a member of this commune.",
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
      msg: "Internal server error.",
    });
  }
};

export const getJoinedCommunes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT 
        c.commune_id,
        c.name ,
        c.commune_image,
        c.description,
        c.privacy,
        c.location,
        cm.joined_at,
        c.commune_type,
        c.created_at,
        cm.role
      FROM 
        commune_memberships cm
      JOIN 
        communes c ON cm.commune_id = c.commune_id
      WHERE 
        cm.user_id = ?
      `,
      [req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        msg: "User is not a member of any communes.",
      });
    }

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching joined communes:", error);
    res.status(500).json({
      success: false,
      msg: "Internal server error.",
    });
  }
};

export const joinCommune = async (req, res) => {
  const communeId = req.params.communeId;
  const userId = req.user.id;

  // Check if the user is already a member
  const checkQuery = `
    SELECT * FROM commune_memberships
    WHERE commune_id = ? AND user_id = ?
  `;

  try {
    const [rows] = await pool.query(checkQuery, [communeId, userId]);

    if (rows.length > 0) {
      return res
        .status(400)
        .json({ message: "User already a member of this commune" });
    }

    // Insert the new membership
    const insertQuery = `
      INSERT INTO commune_memberships (commune_id, user_id, role)
      VALUES (?, ?, 'member')
    `;

    const [result] = await pool.query(insertQuery, [communeId, userId]);

    return res.status(200).json({
      message: "Successfully joined the commune",
      data: { communeId, userId, role: "member" },
    });
  } catch (err) {
    console.error("Error joining commune:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getCommuneReviews = async (req, res) => {
  const communeId = req.params.commune_id;

  try {
    // Query to get reviews for the commune with user details (username, profile_image)
    const query = `
          SELECT cr.review_id, cr.rating, cr.review_text, cr.created_at,
              u.username, u.profile_image
          FROM commune_reviews cr
          JOIN users u ON cr.user_id = u.user_id
          WHERE cr.commune_id = ?
          ORDER BY cr.created_at DESC;
      `;

    const [reviews] = await pool.execute(query, [communeId]);

    // Check if reviews exist
    if (reviews.length === 0) {
      return res
        .status(404)
        .json({ message: "No reviews found for this commune" });
    }

    // Return the reviews along with user info
    res.status(200).json({ reviews: reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const setCommuneReview = async (req, res) => {
  const { communeid } = req.params;
  const { review_text, rating, user_id } = req.body;

  if (!review_text || !rating || !user_id) {
    return res.status(400).json({ msg: "All fields are required." });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ msg: "Rating must be between 1 and 5." });
  }

  try {
    // Insert the new review into the database
    const [result] = await pool.query(
      `INSERT INTO commune_reviews (commune_id, user_id, rating, review_text)
       VALUES (?, ?, ?, ?)`,
      [communeid, user_id, rating, review_text]
    );

    // Return a success response
    res.status(201).json({
      msg: "Review added successfully",
      review: {
        review_id: result.insertId,
        commune_id: communeid,
        user_id: user_id,
        rating,
        review_text,
        created_at: new Date().toISOString(), // Using current timestamp for demo
      },
    });
  } catch (err) {
    console.error("Failed to add review:", err);
    res.status(500).json({ msg: "Error adding review" });
  }
};

// Controller function to create a post
export const createCommunePostBlog = async (req, res) => {
  const { title, content, links, tags } = req.body;
  const { communeId } = req.params;
  const userId = req.user.id;

  const post_type = "blog";

  if (!title || !content || !post_type) {
    return res
      .status(400)
      .json({ message: "Title, content, and post type are required" });
  }

  // Prepare the SQL query to insert the new post
  const query = `
    INSERT INTO posts (commune_id, user_id, title, content, post_type, links, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?)`;

  const values = [
    communeId,
    userId,
    title,
    content,
    post_type,
    links || null,
    tags || null,
  ];

  try {
    // Execute the query asynchronously
    const result = await pool.query(query, values);

    // Send a success response
    res
      .status(201)
      .json({ message: "Post created successfully", postId: result.insertId });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Error creating post" });
  }
};

export const getCommunePosts = async (req, res) => {
  const { communeid } = req.params;

  try {
    // Query to get all posts for the commune
    const query = `
      SELECT p.post_id, p.title, p.content, p.created_at, u.username 
      FROM posts p
      JOIN users u ON p.user_id = u.user_id
      WHERE p.commune_id = ?
      ORDER BY p.created_at DESC
    `;

    const results = await pool.query(query, [communeid]);

    res.json({ posts: results });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Error fetching posts" });
  }
};

export const createCommunePostListing = async (req, res) => {
  const { communeid } = req.params;
  const { metaData, columns, data } = req.body;

  // Assuming you have the user_id from the JWT authentication
  const user_id = req.user.id; // Retrieve from JWT (authentication middleware)

  try {
    // Step 1: Insert new post into the posts table
    const [postResult] = await pool.query(
      "INSERT INTO posts (commune_id, user_id, title, content, post_type, links, tags) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        communeid,
        user_id,
        metaData.title,
        metaData.description,
        "listing",
        metaData.links,
        metaData.tags,
      ]
    );
    const post_id = postResult.insertId;

    // Step 2: Insert dynamic attributes into the post_attributes table
    const postAttributes = data.map((item) => {
      return [
        post_id,
        JSON.stringify(item), // Store attributes as JSON
      ];
    });

    // Use bulk insert for attributes
    await pool.query(
      "INSERT INTO post_attributes (post_id, attributes) VALUES ?",
      [postAttributes]
    );

    // Respond with success
    res.status(200).json({ message: "Listing created successfully", post_id });
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ error: "Error saving data" });
  }
};

export const getCommuneListings = async (req, res) => {
  const { communeid } = req.params;

  try {
    // Fetch all posts of type 'listing' for the specified commune
    const [posts] = await pool.query(
      "SELECT * FROM posts WHERE commune_id = ? AND post_type = 'listing'",
      [communeid]
    );

    const listings = await Promise.all(
      posts.map(async (post) => {
        const [attributes] = await pool.query(
          "SELECT attributes FROM post_attributes WHERE post_id = ?",
          [post.post_id]
        );

        // Safeguard against parsing issues
        const parsedAttributes = attributes.map((attr) => {
          if (typeof attr.attributes === "string") {
            return JSON.parse(attr.attributes);
          }
          return attr.attributes; // Already an object
        });

        // Columns are the names of the attributes
        const columns = parsedAttributes.map((attr) => ({
          attribute_name: attr.attribute_name || "Unnamed Attribute", // Default if `attribute_name` is missing
          attribute_type: attr.attribute_type || "Unknown Type", // Default if `attribute_type` is missing
        }));

        // Rows: Each row is an object with attribute names as keys and values for each person
        const rows = parsedAttributes.map((attr) => ({
          [attr.attribute_name]: Array.isArray(attr.attribute_value)
            ? attr.attribute_value.join(", ") // Join array values with a comma
            : attr.attribute_value || "No Value", // If not an array, use the value or fallback
        }));

        return {
          metaData: {
            title: post.title,
            description: post.content,
            links: post.links,
            tags: post.tags,
          },
          columns,
          rows,
        };
      })
    );

    res.status(200).json(listings);
  } catch (error) {
    console.error("Error fetching listings:", error);
    res.status(500).json({ error: "Error fetching listings" });
  }
};

export const createCommuneEvent = async (req, res) => {
  const { communeid } = req.params;
  const { eventName, eventDescription, eventDate } = req.body;

  if (!eventName || !eventDescription || !eventDate) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if the user is a member of the commune
    const [membership] = await pool.query(
      "SELECT role FROM commune_memberships WHERE commune_id = ? AND user_id = ?",
      [communeid, req.user.id]
    );

    if (!membership.length) {
      return res
        .status(403)
        .json({ message: "You must be a member to create an event." });
    }
    const image = `/uploads/commune_images/events/${req.file.filename}`;
    const eventImage = image;

    // Insert the event into the database
    const [result] = await pool.query(
      `INSERT INTO events (commune_id, event_name, event_description, event_date, event_image, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        communeid,
        eventName,
        eventDescription,
        eventDate,
        eventImage,
        req.user.id,
      ]
    );

    res.status(201).json({
      message: "Event created successfully",
      eventId: result.insertId,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res
      .status(500)
      .json({ message: "Error creating event. Please try again." });
  }
};
