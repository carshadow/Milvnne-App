import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },

    products: [
        {
            product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
            quantity: Number,
            size: String,
            // opcional: coverImage si lo usas en correos
            coverImage: String,
        }
    ],

    total: { type: Number, required: true },

    status: {
        type: String,
        enum: ["Paid", "Pending", "En camino", "Entregada", "Failed", "Expired"],
        default: "Pending",
    },

    archived: { type: Boolean, default: false },

    address: { type: String, required: true }, // dejas 'No address' si no colectas shipping

    email: { type: String },
    name: { type: String },

    // 🔑 Campos para idempotencia y trazabilidad con Stripe
    stripeSessionId: { type: String, index: true, unique: true, sparse: true },
    paymentIntentId: { type: String, index: true },

}, { timestamps: true });

export default mongoose.model("Order", orderSchema);
