import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    imageUrl: { type: String },
    imagePublicId: { type: String }, // ← nuevo campo para eliminar desde Cloudinary
    order: { type: Number }
});

const Category = mongoose.model('Category', categorySchema);
export default Category;