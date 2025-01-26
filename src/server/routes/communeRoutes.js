import express from "express";

import multer from "multer";
import { body } from "express-validator";

import {
  //search
  getSearchCommunes,
  createCommune,
  getUserCommunes,
  getUserCommunesByCommuneId,
  updateCommune,
  getAllCommunes,
  getUserInterestedCommunes,
  deleteCommune,
  getCommuneUserStatus,
  getJoinedCommunes,
  //commune
  joinCommune,
  leaveCommune,
  deleteCommuneMember,
  //members
  getCommuneMembers,
  getCommuneMembersManage,
  getJoinRequestsMembers,
  updateCommuneMembership,
  addChatParticipants,
  updateCommuneMembershipRole,
  //reviews
  getCommuneReviews,
  setCommuneReview,
  deleteCommuneReview,
  //posts
  createCommunePostBlog,
  getCommunePosts,
  deleteCommunePost,
  updateCommunePost,
  //lists
  createCommunePostListing,
  getCommuneListings,
  getCommuneListing,
  deleteCommuneListing,
  updateCommuneListing,
  getCommuneSmallInfo,
  //events
  createCommuneEvent,
  getCommuneEvents,
  getCommuneEvent,
  deleteCommuneEvent,
  updateCommuneEvent,
  getCommuneEventWithDetails,

  //products
  createProduct,
  getCommuneProduct,
  getCommuneProducts,
  getCommunePost,
  // getCommunesByCommuneId,
} from "../controllers/communeController.js";

import { validateToken } from "../middleware/auth.js";

import path from "path";

const router = express.Router();

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/commune_images/"); // Folder where the file will be stored
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // Get file extension
    cb(null, req.user.id + "-" + Date.now() + ext); // Custom file naming
  },
});

// Multer middleware for single file upload
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpeg, png, jpg, gif)"));
    }
  },
}).single("commune_image");

router.post(
  "/create",
  validateToken,
  upload,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("content").notEmpty().withMessage("Content is required"),
  ],
  createCommune
);

// Configure Multer storage
const storageEvent = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/commune_images/events/"); // Folder where the file will be stored
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // Get file extension
    cb(null, req.user.id + "-" + Date.now() + ext); // Custom file naming
  },
});

// Multer middleware for single file upload
export const uploadEvent = multer({
  storage: storageEvent,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpeg, png, jpg, gif)"));
    }
  },
}).single("eventImage");

// Example route for fetching user's communes
router.get("/all", getAllCommunes);
router.get("/user-interested", getUserInterestedCommunes);
router.get("/:username", getUserCommunes);

// router.get("/communes/c/:communeid", getCommunesByCommuneId);
router.get("/joined/:userId", validateToken, getJoinedCommunes);
router.get("/communes/:communeid", getUserCommunesByCommuneId);
router.get("/communes/info/:communeid", getCommuneSmallInfo);
//post
router.get("/post/:postid", getCommunePost);
router.put("/post/:postid", validateToken, updateCommunePost);
router.delete("/post/:postid", validateToken, deleteCommunePost);
//event
router.get("/event/:eventid", getCommuneEvent);
router.put("/event/:eventid", validateToken, uploadEvent, updateCommuneEvent);
router.delete("/event/:eventid", validateToken, deleteCommuneEvent);
//list
router.get("/list/:listid", getCommuneListing);
router.put("/list/:listid", validateToken, updateCommuneListing);
router.delete("/list/:listid", validateToken, deleteCommuneListing);

//product
router.get("/product/:productid", getCommuneProduct);
//members

router.get("/commune-members/:communeId", validateToken, getCommuneMembers);
router.get(
  "/commune-members-manage/:communeId",
  validateToken,
  getCommuneMembersManage
);
router.get("/join-requests/:communeId", getJoinRequestsMembers);
router.patch(
  "/join-status/:membershipId",
  validateToken,
  updateCommuneMembership
);
router.patch(
  "/member-role/:membershipId",
  validateToken,
  updateCommuneMembershipRole
);
// Example route to add participants
router.post(
  "/add-chat-participants/:chatId",
  validateToken,
  addChatParticipants
);

//product

router.get("/:commune_id/reviews", getCommuneReviews);
router.get("/:communeid/posts", getCommunePosts);
router.get("/:communeid/events", getCommuneEvents);
router.get("/:communeid/products", getCommuneProducts);
//list
router.get("/:communeid/lists", getCommuneListings);

//search
router.get("/:communeId/search", getSearchCommunes);

// Route to add a review to a commune
router.post("/:communeid/reviews", validateToken, setCommuneReview);
router.delete("/reviews/:reviewid", validateToken, deleteCommuneReview);
// POST route to create a new post (listing)
router.post(
  "/create/:communeid/listings",
  validateToken,
  createCommunePostListing
);

router.post("/create/:communeId/post", validateToken, createCommunePostBlog);

// Configure Multer storage
const storageProduct = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/commune_images/products/"); // Folder where the file will be stored
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); // Get file extension
    cb(null, req.user.id + "-" + Date.now() + ext); // Custom file naming
  },
});

// Multer middleware for single file upload
export const uploadProduct = multer({
  storage: storageProduct,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpeg, png, jpg, gif)"));
    }
  },
}).single("productImage");

router.post(
  "/create/:communeid/product",
  validateToken,
  uploadProduct,
  createProduct
);

router.post(
  "/create/:communeid/event",
  validateToken,
  uploadEvent,
  createCommuneEvent
);

router.post("/membership/:communeId/join", validateToken, joinCommune);
router.delete("/delete/:communeid", validateToken, deleteCommune);
router.delete("/member/:membershipId", validateToken, deleteCommuneMember);
router.delete("/membership/:communeId/delete", validateToken, leaveCommune);

// Route: GET /api/commune/:communeId/:userId
router.get(
  "/membership/:communeId/:userId",
  validateToken,
  getCommuneUserStatus
);

//event
router.get("/:communeid/event/:eventid", getCommuneEventWithDetails);

router.put(
  "/:communeid",
  validateToken,
  upload,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("content").notEmpty().withMessage("Content is required"),
  ],
  updateCommune
);

export default router;
