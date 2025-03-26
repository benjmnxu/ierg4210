const mysql = require("mysql2");

require("dotenv").config();

const db = mysql.createPool({
  host: process.env.HOST,
  user: process.env.AWS_USER,
  password: process.env.PASSWORD,
  database: process.env.NAME,
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

module.exports = db;
