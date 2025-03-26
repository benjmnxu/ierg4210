const express = require("express");
const crypto = require("crypto");
const db = require("../utils/db");
require("dotenv").config();

const router = express.Router();

// LOGIN
router.post("/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  const query = "SELECT * FROM users WHERE email = ?";
  db.query(query, [email], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0)
      return res.status(401).json({ error: "Invalid credentials" });

    const user = results[0];
    const saltedInput = password + user.salt;
    const hash = crypto.createHash("sha256").update(saltedInput).digest("hex");

    if (hash === user.hash) {
      req.session.regenerate((err) => {
        if (err) return res.status(500).json({ error: "Session regeneration failed" });

        req.session.uid = user.uid;
        req.session.email = user.email;
        req.session.isAdmin = user.is_admin;

        return res.json({ message: "Login successful" });
      });
    } else {
      return res.status(401).json({ error: "Invalid credentials" });
    }
  });
});

// LOGOUT
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });

    res.clearCookie("connect.sid", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return res.json({ message: "Logged out successfully" });
  });
});

// SIGNUP
router.post("/signup", (req, res) => {
  const { email, password, name, admin_code } = req.body;

  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  const checkQuery = "SELECT * FROM users WHERE email = ?";
  db.query(checkQuery, [email], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    if (results.length > 0) {
      return res.status(409).json({ error: "User already exists" });
    }

    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.createHash("sha256").update(password + salt).digest("hex");
    const is_admin = admin_code === process.env.ADMIN_KEY ? 1 : 0;

    const insertQuery = "INSERT INTO users (email, hash, salt, name, is_admin) VALUES (?, ?, ?, ?, ?)";
    db.query(insertQuery, [email, hash, salt, name || null, is_admin], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });

      const new_uid = result.insertId;

      // ✅ Create session
      req.session.regenerate((err) => {
        if (err) return res.status(500).json({ error: "Session regeneration failed" });

        req.session.uid = new_uid;
        req.session.email = email;
        req.session.isAdmin = is_admin;

        return res.status(201).json({ message: "Signup successful" });
      });
    });
  });
});

module.exports = router;
