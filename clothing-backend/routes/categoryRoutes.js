import express from 'express';
import multer from 'multer';
import Category from '../models/Category.js';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = express.Router();

// 🧠 Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 📦 Configurar almacenamiento con Cloudinary
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'categories', // puedes cambiar el nombre de la carpeta en Cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }],
    },
});

const upload = multer({ storage });

// ✅ Obtener todas las categorías
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find().sort({ order: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: 'Server error getting categories' });
    }
});

// ✅ Crear nueva categoría
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Category name is required' });

        const exists = await Category.findOne({ name });
        if (exists) return res.status(400).json({ message: 'Category already exists' });

        const count = await Category.countDocuments();

        const imageUrl = req.file ? req.file.path : null;
        const imagePublicId = req.file ? req.file.filename : null;

        const newCategory = new Category({ name, imageUrl, imagePublicId, order: count });
        await newCategory.save();

        res.status(201).json(newCategory);
    } catch (err) {
        console.error('Error creating category:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// ✅ Eliminar categoría
router.delete('/:id', async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        // 🗑️ Borrar imagen de Cloudinary
        if (category.imagePublicId) {
            await cloudinary.uploader.destroy(category.imagePublicId);
        }

        res.json({ message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting category' });
    }
});

// ✅ Actualizar nombre de categoría
router.put('/:id', async (req, res) => {
    try {
        const { name } = req.body;
        const updated = await Category.findByIdAndUpdate(req.params.id, { name }, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Error renaming category' });
    }
});

// ✅ Actualizar imagen de categoría
router.put('/:id/image', upload.single('image'), async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        // 🗑️ Eliminar imagen anterior de Cloudinary
        if (category.imagePublicId) {
            await cloudinary.uploader.destroy(category.imagePublicId);
        }

        // 🆕 Subir nueva imagen
        category.imageUrl = req.file.path;
        category.imagePublicId = req.file.filename;

        await category.save();
        res.json(category);
    } catch (err) {
        res.status(500).json({ message: 'Error updating image' });
    }
});

// ✅ Reordenar categoría
router.put('/:id/reorder', async (req, res) => {
    try {
        const { order } = req.body;
        const updated = await Category.findByIdAndUpdate(req.params.id, { order }, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Error reordering category' });
    }
});

export default router;
