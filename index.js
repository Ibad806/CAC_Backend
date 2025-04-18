import express from "express";
import morgan from "morgan";
import cors from "cors";
import "dotenv/config";
import mongoose from "mongoose";
import authRoutes from "./routers/authRoutes.js";
import contactRoutes from "./routers/contactRoutes.js";
import eventRoutes from "./routers/eventRoutes.js";
import smecpostRoutes from "./routers/smecpostRoutes.js";
import categoryRoutes from "./routers/categoryRoutes.js";
import passport from "passport";
import session from "express-session";

import helmet from "helmet";
import rateLimit from "express-rate-limit";
const app = express();

app.use(helmet()); // Security Headers

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per IP
  })
);

// const PORT = 4000;

app.use(morgan("tiny"));
app.use(express.json());

// http://localhost:5173
// https://co-curriculum-activities-cs-it.vercel.app
app.use(
  cors({
    origin: ["https://co-curriculum-activities-cs-it.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(
  session({ secret: process.env.GOOGLE_CLIENT_SECRET , resave: false, saveUninitialized: true })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose
  .connect(process.env.MONGODB_URI , {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("mongodb Connected"))
  .catch((err) => console.log("mongodb Connection Error: ", err));

// Use routes
app.use("/auth", authRoutes);
app.use("/contact", contactRoutes);
app.use("/event", eventRoutes);
app.use("/smecpost", smecpostRoutes);
app.use("/category", categoryRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(process.env.PORT, () => console.log("SERVER IS RUNNING"));
