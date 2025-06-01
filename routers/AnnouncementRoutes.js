import express from "express";
import Announcement from "../models/Announcements.js";
import mongoose from "mongoose";

const router = express.Router();

// Create announcement
router.post("/announcements", async (req, res) => {
  try {
    const { title, description, audience } = req.body;
    
    const newAnnouncement = new Announcement({
      title,
      description,
      audience
    });

    const savedAnnouncement = await newAnnouncement.save();
    
    res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      data: savedAnnouncement
    });
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create announcement",
      error: error.message
    });
  }
});

// Get all announcements (sorted by newest first)
router.get("/announcements", async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      success: true,
      data: announcements
    });
  } catch (error) {
    console.error("Error fetching announcements:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch announcements",
      error: error.message
    });
  }
});

// Update announcement
router.put("/announcements/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement ID"
      });
    }

    const { title, description, audience } = req.body;
    
    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      { title, description, audience },
      { new: true, runValidators: true }
    );

    if (!updatedAnnouncement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Announcement updated successfully",
      data: updatedAnnouncement
    });
  } catch (error) {
    console.error("Error updating announcement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update announcement",
      error: error.message
    });
  }
});

// Delete announcement
router.delete("/announcements/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement ID"
      });
    }

    const deletedAnnouncement = await Announcement.findByIdAndDelete(id);

    if (!deletedAnnouncement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Announcement deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting announcement:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete announcement",
      error: error.message
    });
  }
});

export default router;