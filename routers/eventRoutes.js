import express from "express";
import Event from "../models/Event.js";
import multer from "multer";
import { Readable } from "stream";
import cloudinary from "../utils/cloudinary.js";


// ✅ Use memory storage for stream upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = express.Router();

// Helper to upload buffer to Cloudinary
const uploadStreamToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const readable = new Readable();
    readable._read = () => {}; // no-op
    readable.push(buffer);
    readable.push(null); // end the stream

    const stream = cloudinary.uploader.upload_stream(
      { folder: "events" , timeout: 100000  },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    readable.pipe(stream);
  });
};

// POST: Create new event with image upload
router.post("/events", upload.single("eventBannerImage"), async (req, res) => {
  try {
    let eventimageurl = "";
    
    if (req.file) {
  try {
    const uploadResult = await uploadStreamToCloudinary(req.file.buffer);
    eventimageurl = uploadResult.secure_url;
  } catch (cloudError) {
    console.error("Image upload failed:", cloudError);
  }
}


    const newEvent = new Event({
      ...req.body,
      eventimageurl,
    });

    console.log("Creating event with data:", newEvent);
    

    await newEvent.save();

    res.status(201).send({
      message: "Event created successfully",
      event: newEvent,
    });
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(400).send({
      message: "Failed to create event",
      error: error.message,
    });
  }
});

// GET all events
router.get("/events", async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.status(200).send(events);
  } catch (error) {
    res
      .status(500)
      .send({ message: "Failed to fetch events", error: error.message });
  }
});

// GET a single event by ID
router.get("/events/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send({ message: "Event not found" });
    res.status(200).send(event);
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error fetching event", error: error.message });
  }
});

// UPDATE an event
router.put("/events/:id", upload.single("eventBannerImage"), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send({ message: "Event not found" });

    let imageUrl = event.eventImageUrl;
    let imagePublicId = event.eventImagePublicId;

    // If new image is uploaded
    if (req.file) {
      // Delete old image
      if (imagePublicId) {
        await cloudinary.uploader.destroy(imagePublicId);
      }

      const uploaded = await cloudinaryUpload(req.file.buffer);
      imageUrl = uploaded.secure_url;
      imagePublicId = uploaded.public_id;
    }

    // Update fields
    const updatedData = {
      ...req.body,
      eventImageUrl: imageUrl,
      eventImagePublicId: imagePublicId,
    };

    const updatedEvent = await Event.findByIdAndUpdate(req.params.id, updatedData, { new: true });
    res.status(200).send({ message: "Event updated", event: updatedEvent });
  } catch (err) {
    res.status(500).send({ message: "Failed to update event", error: err.message });
  }
});


// DELETE an event
router.delete("/events/:id", async (req, res) => {
  try {
    const deletedEvent = await Event.findByIdAndDelete(req.params.id);
    if (!deletedEvent)
      return res.status(404).send({ message: "Event not found" });
    res.status(200).send({ message: "Event deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Failed to delete event", error: error.message });
  }
});

export default router;
