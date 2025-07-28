import mongoose from "mongoose";
const { Schema } = mongoose;

const judgeSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, default: "judge"},
  contact: { type: String, required: true },
  password: { type: String},
  assignedGames: [{ 
    game: { type: mongoose.Schema.Types.ObjectId, ref: 'Creategame' },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    result: {
      winner: String,
      runnerUp: String,
      announcedAt: Date
    }
  }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
});

const Judge = mongoose.model("Judge", judgeSchema);
export default Judge;