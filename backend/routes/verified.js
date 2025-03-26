const express = require("express");
const crypto = require("crypto");
const db = require("../utils/db");

const router = express.Router();

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

router.post("/change-password", (req, res) => {
  if (!req.session.uid) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Both fields required" });
  }

  db.query("SELECT * FROM users WHERE uid = ?", [req.session.uid], (err, results) => {
    if (err || results.length === 0)
      return res.status(500).json({ error: "User not found" });

    const user = results[0];
    const currentHash = crypto.createHash("sha256").update(currentPassword + user.salt).digest("hex");

    if (currentHash !== user.hash) {
      return res.status(401).json({ error: "Current password incorrect" });
    }

    const newSalt = crypto.randomBytes(16).toString("hex");
    const newHash = crypto.createHash("sha256").update(newPassword + newSalt).digest("hex");

    db.query(
      "UPDATE users SET hash = ?, salt = ? WHERE uid = ?",
      [newHash, newSalt, req.session.uid],
      (err) => {
        if (err) return res.status(500).json({ error: "Failed to update password" });

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

    res.json({ message: "Logged out" });
  });
});

module.exports = router;
