const express = require("express");
const db = require("../db/db");

const router = express.Router();

router.get('/validate', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.json({ valid: false });

  const query = "SELECT * FROM vouchers WHERE code = ?";

  db.query(query, [code], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ valid: false });
    }

    if (results.length === 0) {
      return res.json({ valid: false });
    }

    const voucher = results[0];
    res.json({ valid: true, discount: voucher.discount_amount });
  });
});

module.exports = router;
