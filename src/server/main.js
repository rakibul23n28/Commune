import dotenv from "dotenv";
import ViteExpress from "vite-express";
import app from "./app.js";
import { pool } from "./config/database.js";

dotenv.config();

// Test the database connection
async function testDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("Database connected successfully");
    connection.release();
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }
}

// Main execution
(async () => {
  await testDbConnection();

  const PORT = process.env.PORT || 5000;
  const HOST = process.env.HOST || "0.0.0.0";

  // Create the server manually
  const server = app.listen(PORT, HOST, () =>
    console.log(`Server is running on http://${HOST}:${PORT}`)
  );

  // Bind ViteExpress to the existing server
  ViteExpress.bind(app, server);
})();
