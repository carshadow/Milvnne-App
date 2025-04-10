import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    imageUrl: { type: String, required: false },
});

const Category = mongoose.model('Category', categorySchema);
export default Category;
