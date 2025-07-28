import express from "express";
import Creategame from "../models/Creategame.js";
import multer from "multer";
import stream from "stream";
import cloudinary from "../utils/cloudinary.js"; // cloudinary instance
import mongoose from "mongoose";
import Category from "../models/Category.js";

const router = express.Router();

// ✅ Use memory storage for stream upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper function to upload image to Cloudinary using buffer stream
const uploadToCloudinary = async (file, folder = "game-images") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    const bufferStream = new stream.PassThrough();
    bufferStream.end(file.buffer);
    bufferStream.pipe(uploadStream);
  });
};

// POST - Create new game
router.post("/creategame", upload.single("bannerImage"), async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      date,
      time,
      lead,
      coLead,
      price,
      player,
      venue,
    } = req.body;

    // ✅ Validate and convert to ObjectId
    const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

    const categoryId = isValidObjectId(category)
      ? new mongoose.Types.ObjectId(category)
      : null;
    const leadId = isValidObjectId(lead)
      ? new mongoose.Types.ObjectId(lead)
      : null;
    const coLeadId = isValidObjectId(coLead)
      ? new mongoose.Types.ObjectId(coLead)
      : null;

    if (!categoryId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid category ID" });
    }

    // ✅ Cloudinary Upload
     let bannerImageUrl = "https://via.placeholder.com/600x400";
    let bannerImagePublicId = "placeholder";
    // if (req.file) {
    //   const result = await uploadToCloudinary(req.file, "game-images");
    //   bannerImageUrl = result.secure_url;
    //   bannerImagePublicId = result.public_id;
    // }

    const newGame = new Creategame({
      title,
      category: categoryId,
      description,
      gameImageUrl: bannerImageUrl,
      gameImagePublicId: bannerImagePublicId,
      date,
      time,
      lead: leadId,
      coLead: coLeadId,
      price,
      player,
      venue,
    });

    await newGame.save();

    res
      .status(201)
      .json({
        success: true,
        message: "Game created successfully",
        data: newGame,
      });
  } catch (error) {
    console.error("Error creating game:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to create game",
        error: error.message,
      });
  }
});

// PUT - Update game
router.put("/creategame/:id", async (req, res) => {
  try {
    const updatedGame = await Creategame.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedGame)
      return res.status(404).send({ message: "Game not found" });
    res
      .status(200)
      .send({ message: "Game updated successfully", game: updatedGame });
  } catch (error) {
    res
      .status(400)
      .send({ message: "Failed to update game", error: error.message });
  }
});

// GET - All games
router.get("/creategame", async (req, res) => {
  try {
    const games = await Creategame.find({})
      .populate("category", "title")       // Optional: populate category info
      .populate("lead", "Name")            // Optional: populate lead user name
      .populate("coLead", "Name")          // Optional: populate co-lead user name
      .sort({ createdAt: -1 });

    res.status(200).send(games);
  } catch (error) {
    res
      .status(500)
      .send({ message: "Failed to fetch games", error: error.message });
  }
});

// GET - Single game by ID
router.get("/creategame/:id", async (req, res) => {
  try {
    const game = await Creategame.findById({ category: req.params.categoryId })
    if (!game) return res.status(404).send({ message: "Game not found" });
    res.status(200).send(game);
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error fetching game", error: error.message });
  }
});

// DELETE - Remove game
router.delete("/creategame/:id", async (req, res) => {
  try {
    const deletedGame = await Creategame.findByIdAndDelete(req.params.id);
    if (!deletedGame)
      return res.status(404).send({ message: "Game not found" });
    res.status(200).send({ message: "Game deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Failed to delete game", error: error.message });
  }
});

// Set game results
router.put('/creategame/:id/results', async (req, res) => {
  try {
    const { winner, runnerUp } = req.body;
    const game = await Creategame.findById(req.params.id);

    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    game.results = {
      winner,
      runnerUp,
      announcedAt: new Date()
    };

    await game.save();
    res.json({ success: true, message: 'Results announced', game });
  } catch (error) {
    res.status(500).json({ message: 'Error setting results', error: error.message });
  }
});

export default router;
