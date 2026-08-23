/**
 * routes/auth.js — /api/auth endpoints
 * POST /api/auth/register  — create account, return JWT
 * POST /api/auth/login     — verify credentials, return JWT
 * GET  /api/auth/me        — return current user (requires token)
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// -- helpers ------------------------------------------------------------------

function signToken(user) {
  return jwt.sign(
    { userId: user.id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// -- POST /api/auth/register ---------------------------------------------------

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const errors = [];

  if (!name || !name.trim())          errors.push("Name is required");
  if (!email || !validateEmail(email)) errors.push("A valid email is required");
  if (!password || password.length < 6) errors.push("Password must be at least 6 characters");

  if (errors.length) return res.status(400).json({ errors });

  try {
    const exists = await pool.query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ errors: ["An account with that email already exists"] });
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at",
      [name.trim(), email.toLowerCase(), hash]
    );

    const user = result.rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("POST /api/auth/register error:", err.message);
    res.status(500).json({ errors: ["Registration failed"] });
  }
});

// -- POST /api/auth/login -----------------------------------------------------

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) errors.push("Email is required");
  if (!password) errors.push("Password is required");
  if (errors.length) return res.status(400).json({ errors });

  try {
    const result = await pool.query(
      "SELECT id, name, email, password_hash FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ errors: ["Invalid email or password"] });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ errors: ["Invalid email or password"] });
    }

    const token = signToken(user);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error("POST /api/auth/login error:", err.message);
    res.status(500).json({ errors: ["Login failed"] });
  }
});

// -- GET /api/auth/me ---------------------------------------------------------

router.get("/me", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM users WHERE id = $1",
      [req.user.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ errors: ["User not found"] });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error("GET /api/auth/me error:", err.message);
    res.status(500).json({ errors: ["Failed to fetch user"] });
  }
});

export default router;
