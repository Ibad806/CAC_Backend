import mongoose from "mongoose";
const { Schema } = mongoose;

const EventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    startdate: { type: String, required: true },
    category: {
      type: String,
      enum: ["ticketing", "nonticketing"],
      default: "ticketing",
      required: true,
    },
    subcategory: { type: String, required: true },
    description: { type: String },
    status: {
      type: String,
      enum: ["active", "inactive", "complete", "draft"],
      default: "active",
    },
    ticketPrice: { type: String },
    eventimageurl: { type: String },
    registrationDeadline: { type: String },
    locationDetails: { type: String },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", EventSchema, "event");
export default Event;
