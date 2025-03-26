const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const adminRouter = require("./routes/admin");
const baseRouter = require("./routes/base");
const verifiedRouter = require("./routes/verified");
const authRouter = require("./routes/auth")
const { verifyAuth, requireAdmin } = require("./utils/auth");

require("dotenv").config();

const app = express();
const allowedOrigins = ["http://localhost:5173", "http://13.213.143.57"];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 48 // 2 days
  }
}));

app.use("/api", baseRouter);
app.use("/api", authRouter);
app.use("/api/verified", verifyAuth, verifiedRouter);
app.use("/api/admin", verifyAuth, requireAdmin, adminRouter);

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
