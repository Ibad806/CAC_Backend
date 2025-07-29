import mongoose from "mongoose";

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  cnic: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  email: { type: String },
  ticketPrice: { type: Number, required: true },
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Category", 
    required: true 
  },
  game: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Creategame", 
    required: true 
  },
  registeredAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Player", playerSchema);