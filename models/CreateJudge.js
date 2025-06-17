import mongoose from "mongoose";
const { Schema } = mongoose;

const CreateJudgeSchema = new Schema(
  {
    Name: { type: String, required: true, trim: true },
    ContactNumber: { type: Number, required: true },
    Email: { type: String, required: true },
    subcategory: { type: String, required: true },
    AssignGame: { type: String, required: true },
  },
  { timestamps: true }
);

const CreateJudge = mongoose.model(
  "CreateJudge",
  CreateJudgeSchema,
  "createjudge"
);
export default CreateJudge;
