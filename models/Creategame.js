import mongoose from "mongoose";
// import Category from "./Category";
// import { required } from "joi";
const { Schema } = mongoose;

const creategameSchema = new mongoose.Schema({
  title: { type: String, required: true },
  //   category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  category: { type: String, required: true },
  description: { type: String, required: true },
  gameImageUrl: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  //   lead: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  //   coLead: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
  lead: { type: String, required: true },
  coLead: { type: String, required: true },
  price: { type: Number, required: true },
  player: { type: Number, required: true },
  venue: { type: String, required: true },
});

const Creategame = mongoose.model("Creategame", creategameSchema, "creategame");
export default Creategame;
