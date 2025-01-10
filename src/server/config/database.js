import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// Initialize the MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "testdb",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Export pool for reusable connections
export { pool };
