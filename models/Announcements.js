import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  audience: {
    type: String,
    enum: ["All", "Users", "Judges"],
    default: "All"
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

const Announcement = mongoose.model("Announcement", announcementSchema);
export default Announcement;