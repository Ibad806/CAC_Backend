import mongoose from "mongoose";
const { Schema } = mongoose;

const EventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    startdate: { type: String, required: true },
    enddate: { type: String },
    category: {
      type: String,
      enum: ["ticketing", "nonticketing"],
      required: true,
    },
    subcategory: { type: String },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "inactive", "complete", "draft"],
      default: "active",
    },
    ticketPrice: { type: Number },
    bannerImage: { type: String, required: true },
    galleryImages: { type: [String] },
    locationDetails: { type: String, default: "CS&IT Department" },
    registrationDeadline: { type: String },
    customRoute: { type: String, unique: true }
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", EventSchema, "event");
export default Event;