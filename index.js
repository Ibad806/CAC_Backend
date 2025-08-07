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
import gameRoutes from "./routers/gameRoutes.js";
import judgeRoutes from "./routers/judgeRoutes.js";
import passport from "passport";
import session from "express-session";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import AnnouncementRoutes from "./routers/AnnouncementRoutes.js";
import judgePanelRoutes from "./routers/judgePanelRoutes.js";
import newsRoutes from "./routers/newsRoutes.js";
import playerRoutes from "./routers/playerRoutes.js";

const app = express();

app.use(
  helmet({
    crossOriginOpenerPolicy: false,
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  })
);

app.use(morgan("tiny"));
app.use(express.json());

//http://localhost:5173
//https://co-curriculum-activities-cs-it.vercel.app

app.use(
  cors({
    origin: ["https://co-curriculum-activities-cs-it.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(
  session({
    secret: process.env.GOOGLE_CLIENT_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

mongoose
  .connect(process.env.MONGODB_URI, {
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
app.use("/creategame", gameRoutes);
app.use("/judge", judgeRoutes);
app.use("/announcement", AnnouncementRoutes);
app.use("/judge-panel", judgePanelRoutes);
app.use("/news", newsRoutes);
app.use("/player", playerRoutes);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use('/uploads', express.static('uploads'));
app.listen(process.env.PORT, () => console.log("SERVER IS RUNNING"));