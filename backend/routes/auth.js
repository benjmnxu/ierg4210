const express = require("express");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const db = require("../db/db");
require("dotenv").config();

const router = express.Router();

// LOGIN
router.post("/login", [
    body("email").isEmail().normalizeEmail().isLength({max:100}),
    body("password").isLength({ min: 6, max: 100 }).trim()
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({error: "400 Malformed Input" });

    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: "Email and password required" });

    const query = "SELECT * FROM users WHERE email = ?";
    db.query(query, [email], (err, results) => {
        if (err) return res.status(500).json({ error: "500 Server Error"});
        if (results.length === 0)
        return res.status(401).json({ error: "401 Invalid credentials" });

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
router.post("/signup", [
  body("email").isEmail().normalizeEmail().isLength({min: 1, max:100}),
  body("password").isLength({ min: 6, max: 100 }).trim(),
  body("name").trim().escape().isLength({min: 1, max: 100}),
  body("admin_code").optional().trim()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: "400 Malformed Input (email length < 100, 6 <= password length <= 100, name length <= 100)" });
    const { email, password, name, admin_code } = req.body;

    if (!email || !password)
        return res.status(400).json({ error: "Email and password required" });

    const checkQuery = "SELECT * FROM users WHERE email = ?";
    db.query(checkQuery, [email], (err, results) => {
        if (err) return res.status(500).json({ error: "500 Server Error" });

        if (results.length > 0) {
        return res.status(409).json({ error: "User already exists" });
        }

        const salt = crypto.randomBytes(16).toString("hex");
        const hash = crypto.createHash("sha256").update(password + salt).digest("hex");

        const check_admin = crypto.createHash("sha256").update(admin_code + process.env.ADMIN_SALT).digest("hex");
        const is_admin = check_admin === process.env.ADMIN_HASH ? 1 : 0;

        const insertQuery = "INSERT INTO users (email, hash, salt, name, is_admin) VALUES (?, ?, ?, ?, ?)";
        db.query(insertQuery, [email, hash, salt, name || null, is_admin], (err, result) => {
        if (err) return res.status(500).json({ error: "500 Server Error" });

        const new_uid = result.insertId;

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
