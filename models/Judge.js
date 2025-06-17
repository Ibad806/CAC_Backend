import mongoose from "mongoose";
const { Schema } = mongoose;

const judgeSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, default: "judge"},
  contact: { type: String, required: true },
  password: { type: String},
  assignedGames: [{ type: mongoose.Schema.Types.ObjectId, ref: 'creategame' }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' }, // Reference to the User model
});

const Judge = mongoose.model("Judge", judgeSchema);
export default Judge;
