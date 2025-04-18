import express from "express";
import SMECPost from "../models/SMECPost.js"; // Adjust path if needed
import rateLimit from "express-rate-limit";
import User from "../models/User.js";

const router = express.Router();

// CREATE - POST: Apply for a post
router.post("/smecpost", async (req, res) => {
  try {
    const { name, rollNumber, phone, email, position, subpost, additionalDetails  } = req.body;

    const newPost = new SMECPost({
      Name: name,
      RollNumber: rollNumber,
      ContactNumber: phone,
      Email: email, 
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


const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Get application by email
router.get('/application', limiter , async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email parameter is required' 
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email format' 
      });
    }

    const application = await SMECPost.find({ Email: email }).sort({ createdAt: -1 }).lean();
    
    if (!application) {
      return res.status(404).json({ 
        success: false,
        message: 'No application found for this email' 
      });
    }
    console.log("APPLICATION", application);
    

    res.json({
      success: true,
      data: application

    });

  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error'
    });
  }
});

// UPDATE - PUT: Update status of an application
router.put("/smecpost/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Accepted", "Rejected", "Pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Find the application
    const application = await SMECPost.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Update application status
    application.Status = status;
    await application.save();

    // If application is accepted, update user
    if (status === "Accepted") {
      const user = await User.findOne({ email: application.Email });

      if (user) {
        user.isParticpant = true;
        user.role = "isParticpant";
        user.position = application.Post;     // Add these fields to your User schema if not already present
        user.subpost = application.subpost;
        await user.save();
      }
    }

    res.status(200).json({ message: "Status updated", data: application });
  } catch (error) {
    console.error("Error updating application:", error);
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
