import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    isAdmin: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
}, { timestamps: true });

export default mongoose.model("User", userSchema);
