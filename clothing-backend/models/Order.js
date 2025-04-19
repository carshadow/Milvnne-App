import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    products: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, quantity: Number, size: String }],
    total: { type: Number, required: true },
    status: {
        type: String,
        enum: ["Paid", "Pending", "En camino", "Entregada"],
        default: "Pending"
    },
    archived: {
        type: Boolean,
        default: false
    },
    address: { type: String, required: true },
    email: { type: String },
    name: { type: String }, // ✅ Agrega esto
}, { timestamps: true });


export default mongoose.model("Order", orderSchema);
