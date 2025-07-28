import express from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import Joi from "joi";
import jwt from "jsonwebtoken";
import passport from "passport";
import "../config/passport.js"; 
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import "dotenv/config";
import { OAuth2Client } from "google-auth-library";
import dotenv from "dotenv";
import Judge from "../models/Judge.js";

dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();
const tokenBlacklist = new Set();

// 🔹 Middleware to Check if Token is Blacklisted
const checkTokenBlacklist = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      status: false,
      message: "Authentication token missing",
    });
  }

  if (token && tokenBlacklist.has(token)) {
    return res.status(401).json({
      status: false,
      message: "Token is no longer valid",
    });
  }
  next();
};
// router.use(checkTokenBlacklist);

// 🔹 Joi Validation Schemas
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const registerSchema = Joi.object({
  name: Joi.string().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
  role: Joi.string().valid("user", "lead", "coLead", "admin", "judge").default("user"),
  isParticpant: Joi.boolean().default(false),
  CNIC: Joi.string().min(13).max(15).required(),
});

// 🟢 REGISTER API
router.post("/register", async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ status: false, message: error.details[0].message });
  }

  const existingUser = await User.findOne({ email: value.email });
  if (existingUser) {
    return res.status(403).json({ status: false, message: "Email already exists" });
  }

  const hashedPassword = await bcrypt.hash(value.password, 12);
  value.password = hashedPassword;

  const newUser = new User({ ...value, password: hashedPassword });
  await newUser.save();

  res.status(201).json({ status: true, message: "User registered successfully", data: newUser });
});

// 🟢 LOGIN API
router.post("/login", async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ status: false, message: error.details[0].message });
  }

  const user = await User.findOne({ email: value.email }).lean();
  if (!user) {
    return res.status(403).json({ status: false, message: "User is not registered" });
  }

  const isPasswordValid = await bcrypt.compare(value.password, user.password);
  if (!isPasswordValid) {
    return res.status(403).json({ status: false, message: "Incorrect Credentials" });
  }

  // Check if the user is a judge
  if (user.role === 'judge') {
    // Check if the judge exists and is active
    const judge = await Judge.findOne({ email: user.email });
    if (!judge) {
      return res.status(403).json({ 
        status: false, 
        message: "Judge account not found" 
      });
    }
  }

  const token = jwt.sign(user, process.env.AUTH_SECRET);
  res.status(200).json({ status: true, message: "User login successful", data: { user, token } });
});

// 🟢 JUDGE LOGIN API
router.post("/judge-login", async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ status: false, message: error.details[0].message });
  }

  const user = await User.findOne({ email: value.email });
  if (!user) {
    return res.status(403).json({ status: false, message: "User is not registered" });
  }

  // Check if the user is a judge
  if (user.role !== 'judge') {
    return res.status(403).json({ 
      status: false, 
      message: "Access restricted to judges only" 
    });
  }

  const isPasswordValid = await bcrypt.compare(value.password, user.password);
  if (!isPasswordValid) {
    return res.status(403).json({ status: false, message: "Incorrect Credentials" });
  }

  const token = jwt.sign({ 
    id: user._id, 
    email: user.email, 
    role: user.role 
  }, process.env.AUTH_SECRET, { expiresIn: '1d' });

  res.status(200).json({ status: true, message: "Judge login successful", data: { user, token } });
});

// 🔴 LOGOUT API
router.post("/logout", checkTokenBlacklist, (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(400).json({ status: false, message: "Token is required for logout" });
  }

  jwt.verify(token, process.env.AUTH_SECRET, (err) => {
    if (err) {
      return res.status(403).json({ status: false, message: "Invalid token" });
    }
    tokenBlacklist.add(token);
    res.status(200).json({ status: true, message: "User logged out successfully" });
  });
});

// 🔹 Google OAuth Configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
          user = new User({
            name: profile.displayName,
            email: profile.emails[0].value,
            password: "", // Google users ke liye password nahi
            role: "user",
            isParticipant: false,
            CNIC: profile.id || `GOOGLE-${Date.now()}`, // Unique CNIC assign karein
          });
        
          await user.save();
        }
        

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Step 1: Redirect to Google for authentication (GET request)
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Step 2: Google redirects back to this route after login (GET request)
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id, email: req.user.email }, process.env.AUTH_SECRET);
    res.redirect(`http://localhost:5173/dashboard?token=${token}`);
  }
);

// 🔹 Frontend se Token Receive Karne Wali API
router.post("/google", async (req, res) => {
  try {
      const { tokenId } = req.body;
      if (!tokenId) return res.status(400).json({ message: "Token is required" });

      // Token Verify Karen
      const ticket = await client.verifyIdToken({
          idToken: tokenId,
          audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      let user = await User.findOne({ email: payload.email });

      if (!user) {
          // Naya user create karein agar exist nahi karta
          user = new User({
              name: payload.name,
              email: payload.email,
              password: "", // Google users ke liye password nahi hoga
              googleId: payload.sub,
          });

          await user.save();
      }

      // Token Generate Karein
      const token = jwt.sign({ id: user._id, email: user.email }, process.env.AUTH_SECRET, {
          expiresIn: "7d",
      });

      res.json({ token, user });

  } catch (error) {
      console.error("Google Auth Error:", error);
      res.status(500).json({ message: "Google authentication failed" });
  }
});

export default router;