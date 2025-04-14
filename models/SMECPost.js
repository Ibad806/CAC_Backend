import mongoose from "mongoose";
const { Schema } = mongoose;

const SMECPostSchema = new Schema({
    Name: { type: String, required: true, trim: true },
    RollNumber: { type: String, required: true },    
    ContactNumber: { type: Number, required: true },
    Email: { type: String},
    Post: { type: String, required: true },
    subpost: { type: String },
    Status: { type: String, enum: ["Accepted", "Rejected", "Pending"], default: "Pending" },
    AdditionalDetails: { type: String },
}, { timestamps: true })

const SMECPost = mongoose.model("SMECPost", SMECPostSchema, 'smecpost');
export default SMECPost;