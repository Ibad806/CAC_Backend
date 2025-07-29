import express from "express";
import Player from "../models/Player.js";
import multer from "multer";
import csvParser from "csv-parser";
import stream from "stream";
import Category from "../models/Category.js";
import Creategame from "../models/Creategame.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Create single player
router.post("/", async (req, res) => {
  try {
    const player = new Player(req.body);
    await player.save();
    res.status(201).json(player);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get players with optional filters
router.get("/", async (req, res) => {
  try {
    const { category, game } = req.query;
    let filter = {};
    if (category) filter.category = category;
    if (game) filter.game = game;

    const players = await Player.find(filter)
      .populate("category", "title")
      .populate("game", "title");

    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Import players via CSV (with duplicate check)
router.post("/import", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const results = [];
  const bufferStream = new stream.PassThrough();
  bufferStream.end(req.file.buffer);

  try {
    await new Promise((resolve, reject) => {
      bufferStream
        .pipe(csvParser())
        .on("data", (data) => results.push(data))
        .on("end", resolve)
        .on("error", reject);
    });

    const insertedPlayers = [];

    for (const row of results) {
      const categoryTitle = row.category?.trim().toLowerCase();
      const gameTitle = row.game?.trim().toLowerCase();

      const category = await Category.findOne({
        title: { $regex: new RegExp(`^${categoryTitle}$`, "i") }
      });

      const game = await Creategame.findOne({
        title: { $regex: new RegExp(`^${gameTitle}$`, "i") },
        category: category?._id
      });

      if (!category || !game) {
        console.warn(`Skipping ${row.name}: category/game not found`);
        continue;
      }

      // Check for existing player with same CNIC, category, and game
      const existingPlayer = await Player.findOne({
        cnic: row.cnic,
        category: category._id,
        game: game._id
      });

      if (existingPlayer) {
        console.log(`Duplicate found: ${row.name} - Skipping`);
        continue;
      }

      const newPlayer = new Player({
        name: row.name,
        cnic: row.cnic,
        phone: row.phone,
        email: row.email,
        ticketPrice: parseFloat(row.ticketPrice),
        category: category._id,
        game: game._id
      });

      await newPlayer.save();
      insertedPlayers.push(newPlayer);
    }

    res.status(201).json({
      message: "Players imported successfully",
      count: insertedPlayers.length
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
