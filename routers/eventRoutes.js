import express from "express";
import Event from "../models/Event.js";

const router = express.Router();

// CREATE a new event
router.post("/events", async (req, res) => {
  try {
    const newEvent = new Event(req.body);
    await newEvent.save();
    res
      .status(201)
      .send({ message: "Event created successfully", event: newEvent });
  } catch (error) {
    res
      .status(400)
      .send({ message: "Failed to create event", error: error.message });
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
router.put("/events/:id", async (req, res) => {
  try {
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedEvent)
      return res.status(404).send({ message: "Event not found" });
    res
      .status(200)
      .send({ message: "Event updated successfully", event: updatedEvent });
  } catch (error) {
    res
      .status(400)
      .send({ message: "Failed to update event", error: error.message });
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
