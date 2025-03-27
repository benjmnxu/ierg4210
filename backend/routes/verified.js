const express = require("express");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const db = require("../utils/db");

const router = express.Router();

// GET /me
router.get("/me", (req, res) => {
  if (!req.session.uid) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const query = "SELECT name, is_admin FROM users WHERE uid = ?";
  db.query(query, [req.session.uid], (err, results) => {
    if (err || results.length === 0) {
      return res.status(500).json({ error: "User not found" });
    }

    const user = results[0];
    res.json({
      uid: req.session.uid,
      name: user.name,
      isAdmin: user.is_admin,
    });
  });
});

// POST /change-password
router.post(
  "/change-password",
  [
    body("currentPassword")
      .isLength({ min: 6 })
      .withMessage("Current password must be at least 6 characters")
      .trim(),

    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters")
      .trim(),
  ],
  (req, res) => {
    if (!req.session.uid) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: "400 Malformed Input" });
    }

    const { currentPassword, newPassword } = req.body;

    db.query("SELECT * FROM users WHERE uid = ?", [req.session.uid], (err, results) => {
      if (err || results.length === 0) {
        return res.status(500).json({ error: "User not found" });
      }

      const user = results[0];
      const currentHash = crypto
        .createHash("sha256")
        .update(currentPassword + user.salt)
        .digest("hex");

      if (currentHash !== user.hash) {
        return res.status(401).json({ error: "Current password incorrect" });
      }

      const newSalt = crypto.randomBytes(16).toString("hex");
      const newHash = crypto
        .createHash("sha256")
        .update(newPassword + newSalt)
        .digest("hex");

      db.query(
        "UPDATE users SET hash = ?, salt = ? WHERE uid = ?",
        [newHash, newSalt, req.session.uid],
        (err) => {
          if (err) {
            return res.status(500).json({ error: "Failed to update password" });
          }

          req.session.destroy(() => {
            res.clearCookie("connect.sid", {
              path: "/",
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              sameSite: "strict",
            });

            res.json({ message: "Password updated, please log in again" });
          });
        }
      );
    });
  }
);

// POST /logout
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });

    res.clearCookie("connect.sid", {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.json({ message: "Logged out" });
  });
});

module.exports = router;
