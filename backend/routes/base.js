const express = require("express");
const { param, validationResult } = require("express-validator");
const db = require("../utils/db");
const s3 = require("../utils/s3")

require("dotenv").config();

const router = express.Router();

router.get("/categories", (req, res) => {
  db.query("SELECT * FROM categories", (err, results) => {
    if (err) return res.status(500).json({ error: "500 Server Error" });
    res.json(results);
  });
});

router.get("/products", (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) return res.status(500).json({ error: "500 Server Error" });

    const signedProducts = results.map((product) => {
      if (!product.image_key) return product;

      const thumbnail_signedUrl = s3.getSignedUrl("getObject", {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: product.thumbnail_key,
        Expires: 60 * 5,
      });

      return { ...product, thumbnail: thumbnail_signedUrl };
    });

    res.json(signedProducts);
  });
});

router.get("/products/:pid", 
  [param("pid").isInt().withMessage("Product ID must be an integer")],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: "400 Malformed Input" });
    }
    
    const { pid } = req.params;
    db.query("SELECT * FROM products WHERE pid = ?", [pid], (err, results) => {
      if (err) return res.status(500).json({ error: "500 Server Error" });

      const signedProducts = results.map((product) => {
        if (!product.image_key) return product;

        const image_signedUrl = s3.getSignedUrl("getObject", {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: product.image_key,
          Expires: 60 * 5,
        });

      return { ...product, image: image_signedUrl };
    });

    res.json(signedProducts);
  });
});

module.exports = router;