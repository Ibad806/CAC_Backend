import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  cardImage: { type: String },
  cardImagePublicId: { type: String },
  bannerImage: { type: String },
  bannerImagePublicId: { type: String },
  lead: { type: mongoose.Schema.Types.ObjectId, ref: "SMECPost" },
  coLead: { type: mongoose.Schema.Types.ObjectId, ref: "SMECPost" },
}, { timestamps: true });

export default mongoose.model("Category", categorySchema);
