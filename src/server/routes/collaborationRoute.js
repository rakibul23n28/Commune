import express from "express";

import {
  getCollaborationPosts,
  getCollaborationLists,
  getCollaborationEvents,
  changeCollaborationPostStatus,
  changeCollaborationEventStatus,
  getCollaborationPending,
  getCollaborationRequests,
  deleteCollaborationPost,
  deleteCollaborationEvent,
  collaborationEvent,
  collaborationPost,
} from "../controllers/collaborationController.js";
import { validateToken } from "../middleware/auth.js";

const router = express.Router();

// collaboration
router.post("/post", validateToken, collaborationPost);
router.post("/event", validateToken, collaborationEvent);

//collaboration
router.get("/:communeid/posts", getCollaborationPosts);
router.get("/:communeid/lists", getCollaborationLists);
router.get("/:communeid/events", getCollaborationEvents);
router.patch(
  "/:collaborationid/post",
  validateToken,
  changeCollaborationPostStatus
);
router.patch(
  "/:collaborationid/event",
  validateToken,
  changeCollaborationEventStatus
);
router.get("/:communeid/pending-collaborations", getCollaborationPending);
router.get("/:communeid/my-requests", getCollaborationRequests);

router.delete("/:postid/post", validateToken, deleteCollaborationPost);
router.delete("/:eventid/event", validateToken, deleteCollaborationEvent);

export default router;
