import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    products: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" }, quantity: Number }],
    total: { type: Number, required: true },
    status: {
        type: String,
        enum: ["Paid", "Pending", "En camino", "Entregada"],
        default: "Pending"
    },
    address: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
