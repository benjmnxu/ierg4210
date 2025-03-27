const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const csrf = require("csurf");

const adminRouter = require("./routes/admin");
const baseRouter = require("./routes/base");
const verifiedRouter = require("./routes/verified");
const authRouter = require("./routes/auth")
const { verifyAuth, requireAdmin } = require("./utils/auth");

require("dotenv").config();

const app = express();
const allowedOrigins = ["http://localhost:5173", "http://13.213.143.57", "https://s36.ierg4210.ie.cuhk.edu.hk"];
const csrfProtection = csrf({ cookie: false });

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
    maxAge: 1000 * 60 * 60 * 48
  }
}));
app.use(csrfProtection);
app.use(function setCSP(req, res, next) {
  res.setHeader("Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "object-src 'none'; " +
    "frame-ancestors 'none'; " +
    "base-uri 'self';"
  );
  next();
});

app.use("/api", baseRouter);
app.use("/api", authRouter);
app.use("/api/verified", verifyAuth, verifiedRouter);
app.use("/api/admin", verifyAuth, requireAdmin, adminRouter);

app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
