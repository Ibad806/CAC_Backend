import express from "express";
import Category from "../models/Category.js";
import SMECPost from "../models/SMECPost.js";
import multer from "multer";
import cloudinary from "cloudinary";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

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
  
        let cardImage = "";
        let cardImagePublicId = "";
        let bannerImage = "";
        let bannerImagePublicId = "";
  
        if (req.files.cardImage) {
          const result = await cloudinary.uploader.upload(
            req.files.cardImage[0].path,
            { folder: "card-images" }
          );
          cardImage = result.secure_url;
          cardImagePublicId = result.public_id;
        }
  
        if (req.files.bannerImage) {
          const result = await cloudinary.uploader.upload(
            req.files.bannerImage[0].path,
            { folder: "banner-images" }
          );
          bannerImage = result.secure_url;
          bannerImagePublicId = result.public_id;
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
        res.status(201).json(category);
      } catch (err) {
        res.status(500).json({ error: err.message });
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
          return res.status(404).json({ error: "Category not found" });
        }
  
        const { title, description, lead, coLead } = req.body;
  
        // Delete and update cardImage if new one uploaded
        if (req.files.cardImage) {
          if (category.cardImagePublicId) {
            await cloudinary.uploader.destroy(category.cardImagePublicId);
          }
  
          const result = await cloudinary.uploader.upload(
            req.files.cardImage[0].path,
            { folder: "card-images" }
          );
  
          category.cardImage = result.secure_url;
          category.cardImagePublicId = result.public_id;
        }
  
        // Delete and update bannerImage if new one uploaded
        if (req.files.bannerImage) {
          if (category.bannerImagePublicId) {
            await cloudinary.uploader.destroy(category.bannerImagePublicId);
          }
  
          const result = await cloudinary.uploader.upload(
            req.files.bannerImage[0].path,
            { folder: "banner-images" }
          );
  
          category.bannerImage = result.secure_url;
          category.bannerImagePublicId = result.public_id;
        }
  
        category.title = title;
        category.description = description;
        category.lead = lead;
        category.coLead = coLead;
  
        const updatedCategory = await category.save();
        res.json(updatedCategory);
      } catch (err) {
        res.status(500).json({ error: err.message });
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
      const categories = await Category.find().populate("lead").populate("coLead");
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
