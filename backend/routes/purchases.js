const express = require('express');
const router = express.Router();
const db = require('../db/db');

router.get('/recent', (req, res) => {
    const userId = req.session.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
    const limit = parseInt(req.query.limit, 10) || 5;
    const sql = `
    SELECT o.id, o.total_price, o.currency, o.created_at
    FROM orders o
    WHERE o.user_id = ?
      AND EXISTS (
        SELECT 1
        FROM transactions t
        WHERE t.order_id = o.id
      )
    ORDER BY o.created_at DESC
    LIMIT ?
    `;
  
    db.query(sql, [userId, limit], (err, results) => {
      if (err) {
        console.error('Failed to fetch recent orders:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
  
      res.json(results);
    });
  });

module.exports = router;