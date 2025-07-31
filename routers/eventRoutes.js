import express from "express";
import Event from "../models/Event.js";
import multer from "multer";
import { Readable } from "stream";
import cloudinary from "../utils/cloudinary.js";
import mongoose from "mongoose";

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10 // Max 10 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

const router = express.Router();

const uploadStreamToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);

    const stream = cloudinary.uploader.upload_stream(
      { 
        folder: "events",
        timeout: 60000,
        quality: "auto:good"
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    readable.pipe(stream);
  });
};

// POST: Create new event
router.post("/events", upload.fields([
  { name: 'bannerImage', maxCount: 1 },
  { name: 'galleryImages', maxCount: 9 }
]), async (req, res) => {
  try {
    const body = JSON.parse(req.body.data);
    const files = req.files;
    
    // Validate required fields
    if (!body.title || !body.startdate || !body.description) {
      return res.status(400).json({
        message: "Validation failed",
        error: "Title, start date, and description are required"
      });
    }

    // Process banner image
    if (!files.bannerImage) {
      return res.status(400).json({
        message: "Validation failed",
        error: "Banner image is required"
      });
    }

    const bannerResult = await uploadStreamToCloudinary(files.bannerImage[0].buffer);
    
    // Process gallery images
    let galleryResults = [];
    if (files.galleryImages) {
      galleryResults = await Promise.all(
        files.galleryImages.map(file => 
          uploadStreamToCloudinary(file.buffer)
        )
      );
    }

    // Generate custom route
    const baseRoute = body.title.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    let customRoute = baseRoute;
    let counter = 1;
    
    while (await Event.findOne({ customRoute })) {
      customRoute = `${baseRoute}-${counter}`;
      counter++;
    }

    // Create new event
    const newEvent = new Event({
      title: body.title,
      startdate: body.startdate,
      enddate: body.enddate || null,
      category: body.category || 'nonticketing',
      description: body.description,
      status: body.status || 'active',
      locationDetails: body.locationDetails || 'CS&IT Department',
      registrationDeadline: body.registrationDeadline || null,
      bannerImage: bannerResult.secure_url,
      galleryImages: galleryResults.map(res => res.secure_url),
      customRoute,
      ticketPrice: body.category === 'ticketing' ? body.ticketPrice : null
    });

    await newEvent.save();

    res.status(201).json({
      message: "Event created successfully",
      event: newEvent
    });

  } catch (error) {
    console.error("Error creating event:", error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({
        message: "Validation failed",
        error: error.message
      });
    }

    res.status(500).json({
      message: "Failed to create event",
      error: error.message
    });
  }
});

// GET all events with pagination
router.get("/events", async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }

    const events = await Event.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Event.countDocuments(query);

    res.status(200).json({
      events,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch events",
      error: error.message
    });
  }
});

// GET event by custom route
router.get("/events/route/:route", async (req, res) => {
  try {
    const event = await Event.findOne({ customRoute: req.params.route });
    if (!event) {
      return res.status(404).json({
        message: "Event not found"
      });
    }
    res.status(200).json(event);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching event",
      error: error.message
    });
  }
});

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('Event Route Error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: "File too large",
        error: "Maximum file size is 5MB"
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: "Too many files",
        error: "Maximum 10 files allowed"
      });
    }
  }
  
  if (err.message.includes('image files')) {
    return res.status(400).json({
      message: "Invalid file type",
      error: "Only image files are allowed"
    });
  }

  res.status(500).json({
    message: "Internal server error",
    error: err.message
  });
});

export default router;