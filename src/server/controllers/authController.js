import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/database.js";
import doenv from "dotenv";

doenv.config();

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

import nodemailer from "nodemailer";

const sendVerificationEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your Account",
    text: `Please verify your account by clicking the link below:\n\n${process.env.CLIENT_URL}/verify?token=${token}`,
  };

  await transporter.sendMail(mailOptions);
};

export const verifyAccount = async (req, res) => {
  const { token } = req.body;

  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const [user] = await pool.query("SELECT * FROM Users WHERE user_id = ?", [
      decodedToken.id,
    ]);

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    if (user.is_verified) {
      return res.status(400).json({ msg: "Account already verified" });
    }

    await pool.query("UPDATE Users SET is_verified = 1 WHERE user_id = ?", [
      decodedToken.id,
    ]);

    const [users] = await pool.query("SELECT * FROM Users WHERE user_id = ?", [
      decodedToken.id,
    ]);
    const tokenn = generateToken(users[0]);

    res.json({
      success: true,
      msg: "Account verified successfully",
      token: tokenn,
      user: {
        id: users[0].user_id,
        username: users[0].username,
        email: users[0].email,
        first_name: users[0].first_name,
        last_name: users[0].last_name,
        is_verified: users[0].is_verified,
        profile_image: users[0].profile_image,
        joinedDate: users[0].createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Server error during verification" });
  }
};

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

    if (!user.is_verified) {
      // Generate a verification token
      const verificationToken = jwt.sign(
        { id: user.user_id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" } // Token valid for 1 hour
      );

      // Send verification email
      await sendVerificationEmail(user.email, verificationToken);

      return res.status(403).json({
        msg: "Verification email sent. Please check your email to verify your account.",
      });
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

export const socialRegister = async (req, res) => {
  const { first_name, last_name, username, email, picture, social_id } =
    req.body;

  try {
    // Check if the user already exists by email
    const [existingUser] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    // If the user exists, generate a token and log them in
    if (existingUser.length > 0) {
      const token = generateToken(existingUser[0]); // Assuming generateToken creates a JWT
      return res.status(200).json({
        success: true,
        message: "Login successful.",
        user: {
          id: existingUser[0].user_id,
          username: existingUser[0].username,
          email: existingUser[0].email,
          first_name: existingUser[0].first_name,
          last_name: existingUser[0].last_name,
          is_verified: existingUser[0].is_verified,
          profile_image: existingUser[0].profile_image,
          joinedDate: existingUser[0].createdAt,
        },
        token,
      });
    }

    // Generate a placeholder password for social login users
    const placeholderPassword = await bcrypt.hash(
      `social_login_${social_id}_${Date.now()}`,
      10
    );

    // Insert a new user into the database
    const [result] = await pool.query(
      `INSERT INTO users (social_id, first_name, last_name, username, profile_image, email, password, is_verified) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        social_id || null,
        first_name,
        last_name,
        username,
        picture || null,
        email,
        placeholderPassword, // Placeholder password
        true, // Mark as verified since it's a social login
      ]
    );

    // Fetch the newly created user
    const [newUser] = await pool.query(
      "SELECT * FROM users WHERE user_id = ?",
      [result.insertId]
    );

    // Generate a token for the new user
    const token = generateToken(newUser[0]);

    return res.status(201).json({
      success: true,
      message: "User registered and logged in successfully.",
      user: {
        id: newUser[0].user_id,
        username: newUser[0].username,
        email: newUser[0].email,
        first_name: newUser[0].first_name,
        last_name: newUser[0].last_name,
        is_verified: newUser[0].is_verified,
        profile_image: newUser[0].profile_image,
        joinedDate: newUser[0].createdAt,
      },
      token,
    });
  } catch (error) {
    console.error("Error during social registration:", error.message);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
