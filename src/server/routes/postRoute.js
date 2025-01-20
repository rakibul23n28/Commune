import express from "express";
import {
  makeReaction,
  getComments,
  newComment,
} from "../controllers/postController.js";
import { validateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/:postid/comments", getComments);
// Add a comment to a post
router.post("/:postid/comments", validateToken, newComment);
router.post("/:postid/reactions", validateToken, makeReaction);

export default router;
