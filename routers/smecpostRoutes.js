import express from "express";
import SMECPost from "../models/SMECPost.js"; // Adjust path if needed

const router = express.Router();

// CREATE - POST: Apply for a post
router.post("/smecpost", async (req, res) => {
  try {
    const { name, rollNumber, phone, email, position, subpost, additionalDetails  } = req.body;

    const newPost = new SMECPost({
      Name: name,
      RollNumber: rollNumber,
      ContactNumber: phone,
      Email: email, // Optional email field
      Post: position,
      subpost: subpost || "Lead",
      AdditionalDetails: additionalDetails, // Optional additional details field
     Status: "Pending", // Default status
    });

    await newPost.save();
    res.status(201).json({ message: "Application submitted", data: newPost });
  } catch (error) {
    res.status(500).json({ message: "Error creating post", error });
  }
});

// READ - GET: Get all applications
router.get("/smecpost", async (req, res) => {
  try {
    const posts = await SMECPost.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching posts", error });
  }
});

// Get application by email
router.get('/application', async (req, res) => {
    const { email } = req.query;
    try {
      const application = await SMECPost.findOne({ email });
      if (!application) {
        return res.status(404).json({ message: 'Application not found' });
      }
      res.json(application);
    } catch (error) {
      console.error('Error fetching application:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

// UPDATE - PUT: Update status of an application
router.put("/smecpost/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Accepted", "Rejected", "Pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updatedPost = await SMECPost.findByIdAndUpdate(
      req.params.id,
      { Status: status },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.status(200).json({ message: "Status updated", data: updatedPost });
  } catch (error) {
    res.status(500).json({ message: "Error updating post", error });
  }
});

// DELETE - Remove an application
router.delete("/smecpost/:id", async (req, res) => {
  try {
    const deletedPost = await SMECPost.findByIdAndDelete(req.params.id);

    if (!deletedPost) {
      return res.status(404).json({ message: "Application not found" });
    }

    res.status(200).json({ message: "Application deleted", data: deletedPost });
  } catch (error) {
    res.status(500).json({ message: "Error deleting post", error });
  }
});

export default router;
