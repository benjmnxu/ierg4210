const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const { body, validationResult } = require("express-validator");
const multer = require("multer");
const AWS = require("aws-sdk");
const sharp = require("sharp");
const { v4: uuidv4 } = require("uuid");

require("dotenv").config();

const upload = multer({ storage: multer.memoryStorage() });
const app = express();
app.use(cors({ credentials: true }));
app.use(express.json());

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const db = mysql.createPool({
  host: process.env.HOST,
  user: process.env.USER,
  password: process.env.PASSWORD,
  database: process.env.NAME,
  // port: 3307,
  connectionLimit: 10,
});

// Check database connection
db.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err);
    process.exit(1);
  }
  console.log("✅ Connected to the database");
  connection.release();
});

// 🔹 Get Categories
app.get("/api/categories", (req, res) => {
  db.query("SELECT * FROM categories", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 🔹 Get Products
app.get("/api/products", (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });

    // Generate pre-signed URLs for image access
    const signedProducts = results.map((product) => {
      if (!product.image_key) return product; // Skip if no image

      const thumbnail_signedUrl = s3.getSignedUrl("getObject", {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: product.thumbnail_key, // Ensure your DB stores just the S3 object key
        Expires: 60 * 5, // 5 minutes expiration time
      });

      return { ...product, thumbnail: thumbnail_signedUrl };
    });

    res.json(signedProducts);
  });
});

app.get("/api/products/:pid", (req, res) => {
  const { pid } = req.params;
  db.query("SELECT * FROM products WHERE pid=?", [pid], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    console.log(results)
    // Generate pre-signed URLs for image access
    const signedProducts = results.map((product) => {
      if (!product.image_key) return product; // Skip if no image

      const image_signedUrl = s3.getSignedUrl("getObject", {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: product.image_key, // Ensure your DB stores just the S3 object key
        Expires: 60 * 5, // 5 minutes expiration time
      });
      return { ...product, image: image_signedUrl };
    });

    res.json(signedProducts);
  });
});


app.post("/api/upload", upload.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  const fileExtension = req.file.mimetype.split("/")[1];
  const fileName = `uploads/${uuidv4()}.${fileExtension}`;
  const thumbnailName = `uploads/thumbnails/${uuidv4()}_thumb.${fileExtension}`;

  try {
    // Resize and upload thumbnail
    const thumbnailBuffer = await sharp(req.file.buffer)
      .resize({ width: 300 }) // Resize to 300px width
      .toBuffer();

    await s3.upload({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: thumbnailName,
      Body: thumbnailBuffer,
      ContentType: req.file.mimetype,
    }).promise();

    // Upload original image
    await s3.upload({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    }).promise();

    res.json({ imageKey: fileName, thumbnailKey: thumbnailName });
  } catch (error) {
    console.error("❌ Error uploading image:", error);
    res.status(500).json({ error: "Image upload failed" });
  }
});

// 🔹 Save Image URL in MySQL After Upload
app.post(
  "/api/products",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("price").isFloat({ min: 0 }).withMessage("Invalid price"),
    body("description").notEmpty().withMessage("Description required"),
    body("catid").isInt().withMessage("Valid category required"),
    body("imageKey").notEmpty().withMessage("Image key is required"),
    body("thumbnailKey").notEmpty().withMessage("Thumbnail key is required")
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name, price, description, catid, imageKey, thumbnailKey } = req.body;

    db.query(
      "INSERT INTO products (catid, name, price, description, image_key, thumbnail_key) VALUES (?, ?, ?, ?, ?, ?)",
      [catid, name, price, description, imageKey, thumbnailKey],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Product added successfully" });
      }
    );
  }
);

app.put(
  "/api/products/:id",
  async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    console.log(id, updates)
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    // Remove any undefined or empty values from the update object
    const fieldsToUpdate = Object.entries(updates)
      .filter(([_, value]) => value !== undefined && value !== "")
      .map(([key, _]) => `${key} = ?`);

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    const sqlQuery = `UPDATE products SET ${fieldsToUpdate.join(", ")} WHERE pid = ?`;
    const values = [...Object.values(updates).filter(value => value !== undefined && value !== ""), id];

    db.query(sqlQuery, values, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json({ message: "Product updated successfully" });
    });
  }
);

app.delete(
  "/api/products/:id",
  async (req, res) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Product ID is required" });
    }
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    db.query(
      "DELETE FROM products WHERE pid = ?",
      [id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Product not found" });
        }
        res.json({ message: "Product deleted successfully" });
      }
    );
  }
);

app.put(
  "/api/categories/:id",
  async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    const fieldsToUpdate = Object.entries(updates)
      .filter(([_, value]) => value !== undefined && value !== "")
      .map(([key, _]) => `${key} = ?`);

    if (fieldsToUpdate.length === 0) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    const sqlQuery = `UPDATE categories SET ${fieldsToUpdate.join(", ")} WHERE catid = ?`;
    const values = [...Object.values(updates).filter(value => value !== undefined && value !== ""), id];

    db.query(sqlQuery, values, (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json({ message: "Product updated successfully" });
    });
  }
);

app.post(
  "/api/categories",
  [
    body("name").notEmpty().withMessage("Name is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { name } = req.body;

    // 🔹 Store Image URL in MySQL
    db.query(
      "INSERT INTO categories (name) VALUES (?)",
      [name],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Product added successfully" });
      }
    );
  }
);

app.delete(
  "/api/categories/:id",
  async (req, res) => {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Category ID is required" });
    }
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid category ID" });
    }

    db.query(
      "DELETE FROM categories WHERE catid = ?",
      [id],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        if (result.affectedRows === 0) {
          return res.status(404).json({ error: "Category not found" });
        }
        res.json({ message: "Category deleted successfully" });
      }
    );
  }
);

// Start Express Server
const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
