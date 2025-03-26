const express = require("express");
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");
const AWS = require("aws-sdk");
const db = require("../utils/db");
const upload = multer({ storage: multer.memoryStorage() });

require("dotenv").config();

const router = express.Router();

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

router.post("/upload", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const fileExtension = req.file.mimetype.split("/")[1];
  const fileName = `uploads/${uuidv4()}.${fileExtension}`;
  const thumbnailName = `uploads/thumbnails/${uuidv4()}_thumb.${fileExtension}`;

  try {
    const thumbnailBuffer = await sharp(req.file.buffer)
      .resize({ width: 300 })
      .toBuffer();

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

// 🔹 Add Product
router.post(
  "/products",
  [
    body("name").notEmpty(),
    body("price").isFloat({ min: 0 }),
    body("description").notEmpty(),
    body("catid").isInt(),
    body("imageKey").notEmpty(),
    body("thumbnailKey").notEmpty(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, price, description, catid, imageKey, thumbnailKey } = req.body;
    db.query(
      "INSERT INTO products (catid, name, price, description, image_key, thumbnail_key) VALUES (?, ?, ?, ?, ?, ?)",
      [catid, name, price, description, imageKey, thumbnailKey],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Product added" });
      }
    );
  }
);

// 🔹 Update Product
router.put("/products/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const fieldsToUpdate = Object.entries(updates)
    .filter(([_, val]) => val !== undefined && val !== "")
    .map(([key, _]) => `${key} = ?`);

  if (!fieldsToUpdate.length) return res.status(400).json({ error: "No updates" });

  const sql = `UPDATE products SET ${fieldsToUpdate.join(", ")} WHERE pid = ?`;
  const values = [...Object.values(updates).filter(val => val !== undefined && val !== ""), id];

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Updated" });
  });
});

// 🔹 Delete Product
router.delete("/products/:id", (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  db.query("DELETE FROM products WHERE pid = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  });
});

router.post("/categories", [body("name").notEmpty()], (req, res) => {
  const { name } = req.body;
  console.log(name)
  db.query("INSERT INTO categories (name) VALUES (?)", [name], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Category added" });
  });
});

router.put("/categories/:id", (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const fieldsToUpdate = Object.entries(updates)
    .filter(([_, value]) => value !== undefined && value !== "")
    .map(([key, _]) => `${key} = ?`);

  const sql = `UPDATE categories SET ${fieldsToUpdate.join(", ")} WHERE catid = ?`;
  const values = [...Object.values(updates).filter(value => value !== undefined && value !== ""), id];

  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Updated" });
  });
});

router.delete("/categories/:id", (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  db.query("DELETE FROM categories WHERE catid = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted" });
  });
});

module.exports = router;
