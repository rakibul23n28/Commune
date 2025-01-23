import dotenv from "dotenv";
import ViteExpress from "vite-express";
import app from "./app.js";
import { pool } from "./config/database.js";
import { initSocket } from "./config/socket.js";

dotenv.config();

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

(async () => {
  await testDbConnection();

  const PORT = process.env.PORT || 5000;
  const HOST = process.env.HOST || "0.0.0.0";

  const server = app.listen(PORT, HOST, () =>
    console.log(`Server is running on http://${HOST}:${PORT}`)
  );

  // Initialize socket.io
  initSocket(server);

  ViteExpress.bind(app, server);
})();
