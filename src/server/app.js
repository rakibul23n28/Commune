import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import authRoute from "./routes/authRoutes.js";
import staticRoute from "./routes/staticRoutes.js";
import userRoute from "./routes/userRoutes.js";
import communeRoute from "./routes/communeRoutes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Middleware to parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/commune", communeRoute);
app.use("/api/auth", authRoute);
app.use("/api/user", userRoute);
app.use("/api", staticRoute);
// app.use("/api/notes", noteRoute);

export default app;