// routes/contactRoutes.js
import express from "express";
import Contact from "../models/ContactForm.js";

const router = express.Router();

router.post("/contact", async (req, res) => {
  const { name, email, department, subject, message, userID } = req.body;
  console.log(req.body);

  const newContact = new Contact({
    name,
    email,
    department,
    subject,
    message,
    User: userID ? userID : null,
  });

  try {
    await newContact.save();
    res.status(201).send({ message: "Message received successfully." });
  } catch (error) {
    res.status(500).send({ message: "Failed to save the message." });
  }
});
  
export default router;
