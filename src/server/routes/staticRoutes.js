import express from "express";
// import { validateToken } from "../middleware/auth.js";

const router = express.Router();

router.get("/", (req, res) => {
  return res.status(200).json({ message: "Hello World!" });
});

export default router;
