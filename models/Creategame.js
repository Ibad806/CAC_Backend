import mongoose from "mongoose";
const { Schema } = mongoose;

const creategameSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  description: { type: String, required: true },
  gameImageUrl: { type: String, required: true },
  gameImagePublicId: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  lead: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  coLead: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  price: { type: Number, required: true },
  player: { type: Number, required: true },
  venue: { type: String, required: true },
});

const Creategame = mongoose.model("Creategame", creategameSchema, "creategame");
export default Creategame;
