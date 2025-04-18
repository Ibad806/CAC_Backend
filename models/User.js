import mongoose from "mongoose";
const { Schema } = mongoose;

const UserSchema = new Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, },
    password: { type: String},
    role: { type: String, enum: ["user", "isParticpant", "judge", "admin"], default: "user" },
    isParticpant: { type: Boolean, default: false },
    CNIC: { type: String , unique: true, sparse: true, },
    position: { type: String },
    subpost: { type: String },
}, { timestamps: true })

const User = mongoose.model("Users", UserSchema, 'users');
export default User;