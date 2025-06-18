import express from "express";
import Category from "../models/Category.js";
import SMECPost from "../models/SMECPost.js";
import multer from "multer";
import cloudinary from "cloudinary";
import mongoose from "mongoose";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// CREATE category
router.post(
  "/categories",
  upload.fields([
    { name: "cardImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, description, lead, coLead } = req.body;

      console.log("Request Body:", req.body);
      console.log("Uploaded Files:", req.files);

      let cardImage = "";
      let cardImagePublicId = "";
      let bannerImage = "";
      let bannerImagePublicId = "";

      // Helper function to upload image to Cloudinary
      const uploadToCloudinary = async (file) => {
        if (!file) return null;
        
        return new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            { folder: "category-images" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          
          // Create a readable stream from buffer
          const bufferStream = new stream.PassThrough();
          bufferStream.end(file.buffer);
          bufferStream.pipe(uploadStream);
        });
      };

      // Upload card image if exists
      if (req.files?.cardImage && req.files.cardImage[0]) {
        try {
          const result = await uploadToCloudinary(req.files.cardImage[0]);
          if (result) {
            cardImage = result.secure_url;
            cardImagePublicId = result.public_id;
          }
        } catch (uploadError) {
          console.error("Error uploading card image:", uploadError);
        }
      }

      // Upload banner image if exists
      if (req.files?.bannerImage && req.files.bannerImage[0]) {
        try {
          const result = await uploadToCloudinary(req.files.bannerImage[0]);
          if (result) {
            bannerImage = result.secure_url;
            bannerImagePublicId = result.public_id;
          }
        } catch (uploadError) {
          console.error("Error uploading banner image:", uploadError);
        }
      }

      const category = new Category({
        title,
        description,
        lead,
        coLead,
        cardImage,
        cardImagePublicId,
        bannerImage,
        bannerImagePublicId,
      });

      await category.save();
      res.status(201).json({ success: true, category });
    } catch (err) {
      console.error("Error creating category:", err);
      res.status(500).json({ 
        success: false, 
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  }
);

// UPDATE category
router.put(
  "/categories/:id",
  upload.fields([
    { name: "cardImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const category = await Category.findById(req.params.id);
      if (!category) {
        return res.status(404).json({ success: false, error: "Category not found" });
      }

      const { title, description, lead, coLead } = req.body;

      // Helper function for Cloudinary upload
      const uploadImage = async (file, publicIdToDelete = null) => {
        try {
          // Delete old image if exists
          if (publicIdToDelete) {
            await cloudinary.uploader.destroy(publicIdToDelete);
          }

          // Upload new image using stream
          return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              { folder: "category-images" },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            
            const bufferStream = new stream.PassThrough();
            bufferStream.end(file.buffer);
            bufferStream.pipe(uploadStream);
          });
        } catch (error) {
          console.error("Image upload error:", error);
          throw error;
        }
      };

      // Process card image if uploaded
      if (req.files?.cardImage && req.files.cardImage[0]) {
        try {
          const result = await uploadImage(
            req.files.cardImage[0],
            category.cardImagePublicId
          );
          category.cardImage = result.secure_url;
          category.cardImagePublicId = result.public_id;
        } catch (error) {
          console.error("Failed to update card image:", error);
          // Continue with other updates even if image upload fails
        }
      }

      // Process banner image if uploaded
      if (req.files?.bannerImage && req.files.bannerImage[0]) {
        try {
          const result = await uploadImage(
            req.files.bannerImage[0],
            category.bannerImagePublicId
          );
          category.bannerImage = result.secure_url;
          category.bannerImagePublicId = result.public_id;
        } catch (error) {
          console.error("Failed to update banner image:", error);
          // Continue with other updates even if image upload fails
        }
      }

      // Update other fields
      category.title = title || category.title;
      category.description = description || category.description;
      category.lead = lead || category.lead;
      category.coLead = coLead || category.coLead;

      const updatedCategory = await category.save();
      
      res.json({
        success: true,
        category: updatedCategory,
        message: "Category updated successfully"
      });
    } catch (err) {
      console.error("Error updating category:", err);
      res.status(500).json({ 
        success: false, 
        error: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  }
);

// DELETE category
router.delete("/categories/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Delete images from Cloudinary
    if (category.cardImagePublicId) {
      await cloudinary.uploader.destroy(category.cardImagePublicId);
    }

    if (category.bannerImagePublicId) {
      await cloudinary.uploader.destroy(category.bannerImagePublicId);
    }

    await category.deleteOne();
    res.json({ message: "Category and its images deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all categories
router.get("/categories", async (req, res) => {
  try {
    console.log("Fetching categories from database...");
    const categories = await Category.find()
      .populate("lead")
      .populate("coLead");
    console.log(`Found ${categories.length} categories`);
    res.json(categories);
  } catch (err) {
    console.error("Category fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET category by ID
router.get("/categories/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate("lead")
      .populate("coLead");
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
      } catch (err) {
        console.error("Category fetch error:", err);
        res.status(500).json({ error: err.message });
        }
      });

// Replace the existing /users/accepted route with this:
router.get("/users/accepted", async (req, res) => {
  try {
    const leadUsers = await SMECPost.find({
      Post: { $in: ["E-Games", "Geek Games", "General Games"] }, // Fixed typo: "Geek Games"
      subpost: "Lead",
    }).select("Name Email _id Post ContactNumber");

    const coLeadUsers = await SMECPost.find({
      Post: { $in: ["E-Games", "Geek Games", "General Games"] },
      subpost: "Co-Lead",
    }).select("Name Email _id Post ContactNumber");

    res.status(200).json({
      success: true,
      data: {
        lead: leadUsers,
        coLead: coLeadUsers,
      },
    });
  } catch (error) {
    console.error("Error fetching participants by subpost:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch participants",
    });
  }
});
export default router;
