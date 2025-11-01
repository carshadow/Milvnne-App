import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    discount: { type: Number, default: 0 },
    coverImage: String,
    hoverImage: String,
    images: [String],
    category: { type: String, required: true },
    description: { type: String, required: true },
    hasSizes: {
        type: Boolean,
        default: false,
    },

    // ✅ Reemplaza tu versión anterior de "sizes" por esto
    sizes: {
        type: Map,
        of: Number,
        default: undefined, // ⚡ evita que cree {S:0,M:0,L:0,XL:0} cuando no hay tallas
    },

    // ✅ Stock general
    stock: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });


export default mongoose.model("Product", productSchema);
