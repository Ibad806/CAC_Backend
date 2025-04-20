import express from "express";
import Category from "../models/Category.js";
import SMECPost from "../models/SMECPost.js";
import multer from "multer";
import stream from "stream";
// import cloudinary from "cloudinary";
import cloudinary from "../utils/cloudinary.js"; // make sure path is correct

const router = express.Router();
// ✅ Use memory storage for stream upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Helper function to upload image to Cloudinary using buffer stream
const uploadToCloudinary = async (file, folder = "category-images") => {
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

// ✅ CREATE Category
router.post(
  "/categories",
  upload.fields([
    { name: "cardImage", maxCount: 1 },
    { name: "bannerImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { title, description, lead, coLead } = req.body;

      let cardImage = "", cardImagePublicId = "";
      let bannerImage = "", bannerImagePublicId = "";

      // Upload card image
      if (req.files?.cardImage?.[0]) {
        const result = await uploadToCloudinary(req.files.cardImage[0]);
        cardImage = result.secure_url;
        cardImagePublicId = result.public_id;
      }

      // Upload banner image
      if (req.files?.bannerImage?.[0]) {
        const result = await uploadToCloudinary(req.files.bannerImage[0]);
        bannerImage = result.secure_url;
        bannerImagePublicId = result.public_id;
      }

      const newCategory = new Category({
        title,
        description,
        lead,
        coLead,
        cardImage,
        cardImagePublicId,
        bannerImage,
        bannerImagePublicId,
      });

      const savedCategory = await newCategory.save();
      res.status(201).json(savedCategory);

    } catch (err) {
      console.error("Error creating category:", err);
      res.status(500).json({ 
        success: false, 
        error: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
      });
    }
  }
);

// ✅ UPDATE Category
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

      // Upload & replace card image
      if (req.files?.cardImage?.[0]) {
        if (category.cardImagePublicId) {
          await cloudinary.uploader.destroy(category.cardImagePublicId);
        }
        const result = await uploadToCloudinary(req.files.cardImage[0]);
        category.cardImage = result.secure_url;
        category.cardImagePublicId = result.public_id;
      }

      // Upload & replace banner image
      if (req.files?.bannerImage?.[0]) {
        if (category.bannerImagePublicId) {
          await cloudinary.uploader.destroy(category.bannerImagePublicId);
        }
        const result = await uploadToCloudinary(req.files.bannerImage[0]);
        category.bannerImage = result.secure_url;
        category.bannerImagePublicId = result.public_id;
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
        message: "Category updated successfully",
      });

    } catch (err) {
      console.error("Error updating category:", err);
      res.status(500).json({ 
        success: false, 
        error: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
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
    const categories = await Category.find()
      .populate("lead")
      .populate("coLead");
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Fetch participants by subpost (lead and co lead)
router.get("/users/accepted", async (req, res) => {
  try {
    const leadUsers = await SMECPost.find({
      Post: { $in: ["E-Games", "Geek Gemes", "General Games"] },
      subpost: "Lead",
    }).select("Name Email _id Post ContactNumber");

    const coLeadUsers = await SMECPost.find({
      Post: { $in: ["E-Games", "Geek Gemes", "General Games"] },
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
