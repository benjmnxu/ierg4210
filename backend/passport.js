const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const db = require("./db/db");

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.NODE_ENV == "dev" ? "http://localhost:3000/api/auth/google/callback" : process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  const email = profile.emails[0].value;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, results) => {
    if (err) return done(err);

    if (results.length > 0) {
      return done(null, results[0]);
    } else {
      const insert = "INSERT INTO users (email, name, is_admin) VALUES (?, ?, 0)";
      db.query(insert, [email, profile.displayName], (err, result) => {
        if (err) return done(err);
        db.query("SELECT * FROM users WHERE uid = ?", [result.insertId], (err, results) => {
          if (err) return done(err);
          return done(null, results[0]);
        });
      });
    }
  });
}));

passport.serializeUser((user, done) => done(null, user.uid));
passport.deserializeUser((uid, done) => {
  db.query("SELECT * FROM users WHERE uid = ?", [uid], (err, results) => {
    if (err) return done(err);
    done(null, results[0]);
  });
});

module.exports = passport;
