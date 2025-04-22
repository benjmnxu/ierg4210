const express = require("express");
const { body, param, validationResult } = require("express-validator");
const multer = require("multer");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const db = require("../db/db");
const { getOrderById } = require("../db/helpers");
const upload = multer({ storage: multer.memoryStorage() });

require("dotenv").config();

const router = express.Router();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Upload image and thumbnail
router.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const fileExtension = req.file.mimetype.split("/")[1];

  const allowedTypes = ["jpeg", "png", "jpg"];
  if (!allowedTypes.includes(fileExtension)) {
    return res.status(400).json({ error: "Unsupported file type" });
  }

  const fileName = `uploads/${uuidv4().replace(/[^a-z0-9]/gi, "_")}.${fileExtension}`;
  const thumbnailName = `uploads/thumbnails/${uuidv4()}_thumb.${fileExtension}`;

  try {
    const thumbnailBuffer = await sharp(req.file.buffer).resize({ width: 300 }).toBuffer();

    await s3.upload({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: thumbnailName,
      Body: thumbnailBuffer,
      ContentType: req.file.mimetype,
    }).promise();

    await s3.upload({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }).promise();

    res.json({ imageKey: fileName, thumbnailKey: thumbnailName });
  } catch (error) {
    console.error("❌ Upload failed:", error);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Add Product
router.post("/products", [
  body("name").trim().escape().isLength({ min: 1, max: 100 }),
  body("price").isFloat({ min: 0, max: 10000000 }),
  body("description").trim().escape().isLength({ min: 1, max: 1000 }),
  body("catid").isInt(),
  body("imageKey").notEmpty(),
  body("thumbnailKey").notEmpty(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: "400 Malformed Input"});

  const { name, price, description, catid, imageKey, thumbnailKey } = req.body;
  db.query(
    "INSERT INTO products (catid, name, price, description, image_key, thumbnail_key) VALUES (?, ?, ?, ?, ?, ?)",
    [catid, name, price, description, imageKey, thumbnailKey],
    (err) => {
      if (err) return res.status(500).json({ error: "500 Server Error"});
      res.json({ message: "Product added" });
    }
  );
});

// Update Product
router.put("/products/:id", [
  param("id").isInt(),

  body("name").optional().trim().escape().isLength({ min: 1, max: 100 }),
  body("price").optional().isFloat({ min: 0, max: 10000000.00 }),
  body("description").optional().trim().escape().isLength({ max: 1000 }),
  body("catid").optional().isInt(),
  body("image_key").optional().notEmpty(),
  body("thumbnail_key").optional().notEmpty(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: "400 Malformed Input" });

  const { id } = req.params;
  const updates = req.body;

  const allowedFields = ["name", "price", "description", "catid", "image_key", "thumbnail_key"];
  const filteredUpdates = Object.entries(updates).filter(([key, val]) => allowedFields.includes(key) && val !== undefined && val !== "");

  if (!filteredUpdates.length) return res.status(400).json({ error: "No valid updates" });

  const fieldsToUpdate = filteredUpdates.map(([key]) => `${key} = ?`).join(", ");
  const values = [...filteredUpdates.map(([_, val]) => val), id];

  const sql = `UPDATE products SET ${fieldsToUpdate} WHERE pid = ?`;

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: "500 Server Error" });
    if (result.affectedRows === 0) return res.status(404).json({ error: "404 Not found" });
    res.json({ message: "Updated" });
  });
});

// Delete Product
router.delete("/products/:id", [
  param("id").isInt(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: "400 Malformed Input" });

  const { id } = req.params;
  db.query("DELETE FROM products WHERE pid = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: "500 Server Error" });
    if (result.affectedRows === 0) return res.status(404).json({ error: "404 Not found" });
    res.json({ message: "Deleted" });
  });
});

// Add Category
router.post("/categories", [
  body("name").trim().escape().isLength({ min: 1, max: 100 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: "400 Malformed Input" });

  const { name } = req.body;
  db.query("INSERT INTO categories (name) VALUES (?)", [name], (err) => {
    if (err) return res.status(500).json({ error: "500 Server Error"});
    res.json({ message: "Category added" });
  });
});

// Update Category
router.put("/categories/:id", [
  param("id").isInt(),
  body("name").optional().trim().escape().isLength({ min: 1, max: 100 }),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: "400 Malformed Input" });

  const { id } = req.params;
  const updates = req.body;

  const allowedFields = ["name"];
  const filteredUpdates = Object.entries(updates).filter(([key, val]) => allowedFields.includes(key) && val !== undefined && val !== "");

  if (!filteredUpdates.length) return res.status(400).json({ error: "No valid updates" });

  const fieldsToUpdate = filteredUpdates.map(([key]) => `${key} = ?`).join(", ");
  const values = [...filteredUpdates.map(([_, val]) => val), id];

  const sql = `UPDATE categories SET ${fieldsToUpdate} WHERE catid = ?`;

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: "500 Server Error" });
    if (result.affectedRows === 0) return res.status(404).json({ error: "404 Not found" });
    res.json({ message: "Updated" });
  });
});

// Delete Category
router.delete("/categories/:id", [
  param("id").isInt(),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: "400 Malformed Input" });

  const { id } = req.params;
  db.query("DELETE FROM categories WHERE catid = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: "404 Not found" });
    res.json({ message: "Deleted" });
  });
});

router.get("/orders", (req, res) => {
  db.query(
    `SELECT id, user_id, currency, merchant_email, total_price, created_at
       FROM orders`,
    (err, orders) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Failed to load orders" });
      }
      if (orders.length === 0) {
        return res.json([]);
      }

      const ids = orders.map(o => o.id);
      db.query(
        `SELECT order_id, product_id, quantity, unit_price
           FROM order_items
          WHERE order_id IN (?)`,
        [ids],
        (err2, items) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json({ error: "Failed to load order items" });
          }

          const itemsByOrder = items.reduce((acc, i) => {
            (acc[i.order_id] ||= []).push({
              product_id: i.product_id,
              quantity:   i.quantity,
              unit_price: i.unit_price,
            });
            return acc;
          }, {});

          const fullOrders = orders.map(o => ({
            id:             o.id,
            user_id:        o.user_id,
            currency:       o.currency,
            merchant_email: o.merchant_email,
            created_at:     o.created_at,
            total_price:    o.total_price,
            items:          itemsByOrder[o.id] || []
          }));

          res.json(fullOrders);
        }
      );
    }
  );
});


module.exports = router;
