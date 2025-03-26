function verifyAuth(req, res, next) {
  if (req.session && req.session.uid) {
    next();
  } else {
    res.status(401).json({ error: "Authentication required" });
  }
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) {
    next();
  } else {
    res.status(403).json({ error: "Admin access only" });
  }
}

module.exports = { verifyAuth, requireAdmin };
