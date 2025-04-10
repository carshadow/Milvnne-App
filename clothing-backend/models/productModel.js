import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    coverImage: { type: String, required: true },  // ✅ Ahora es obligatorio
    images: [{ type: String }],  // ✅ Ahora es un array de strings
    category: { type: String, required: true },
    // stock: { type: Number, required: true, default: 0 },
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
