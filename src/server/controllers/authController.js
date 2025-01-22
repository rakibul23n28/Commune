import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/database.js";

// Helper function to create and send JWT
const generateToken = (user) => {
  const payload = {
    id: user.user_id,
    email: user.email,
    joinedDate: user.createdAt,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });
  return token;
};

export const existUsername = async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT username FROM Users WHERE username = ?",
      [req.params.username]
    );

    if (users.length > 0) {
      res.json({ exists: true });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error during user retrieval" });
  }
};
// Register a new user
export const register = async (req, res) => {
  const { username, email, password, first_name, last_name } = req.body;

  if (!username || !email || !password || !first_name || !last_name) {
    return res.status(400).json({ msg: "Please provide all required fields" });
  }

  try {
    const [existingUser] = await pool.query(
      "SELECT * FROM Users WHERE email = ? OR username = ?",
      [email, username]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({
        msg: "Email is already registered",
        success: false,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO Users (username, email, password,first_name, last_name) VALUES (?, ?, ?, ?, ?)",
      [username, email, hashedPassword, first_name, last_name]
    );

    res.status(201).json({ msg: "User registered successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error during registration" });
  }
};

// Login user and return JWT token
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ msg: "Please provide email and password" });
  }

  try {
    const [users] = await pool.query("SELECT * FROM Users WHERE email = ?", [
      email,
    ]);
    const user = users[0];
    if (!user) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    const token = generateToken(user);

    res.json({
      msg: "Login successful",
      token,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_verified: user.is_verified,
        profile_image: user.profile_image,
        joinedDate: user.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error during login" });
  }
};

// Logout user
export const logout = (req, res) => {
  res.json({ msg: "Logout successful" });
};

// Route to validate token
export const validate = async (req, res) => {
  const [user] = await pool.query("SELECT * FROM Users WHERE user_id = ? ", [
    req.user.id,
  ]);

  if (user.length === 0) {
    return res.status(401).json({ isValid: false });
  }
  res.json({ isValid: true });
};
