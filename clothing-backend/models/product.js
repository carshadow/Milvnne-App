import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    discount: { type: Number, default: 0 },
    coverImage: { type: String, required: true },
    hoverImage: { type: String, required: true },
    images: [{ type: String }],
    category: { type: String, required: true },
    description: { type: String, required: true },
    hasSizes: { type: Boolean, default: true },
    sizes: {
        S: { type: Number, default: 0 },
        M: { type: Number, default: 0 },
        L: { type: Number, default: 0 },
        XL: { type: Number, default: 0 }
    },
    stock: { type: Number, default: 0 }
}, { timestamps: true });


export default mongoose.model("Product", productSchema);
