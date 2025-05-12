import express from 'express';
import multer from 'multer';
import Category from '../models/Category.js';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { authenticateUser, verifyAdmin } from "../middlewares/authMiddleware.js";
import csrfProtection from "../middlewares/csrfMiddleware.js";


const router = express.Router();

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage config
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'categories',
        allowed_formats: ['jpg', 'jpeg', 'png'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }],
    },
});

const upload = multer({ storage });

// Obtener todas las categorías (no necesita autenticación)
router.get('/', async (req, res) => {
    try {
        const categories = await Category.find().sort({ order: 1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: 'Server error getting categories' });
    }
});

// Crear categoría
router.post('/', authenticateUser, verifyAdmin, csrfProtection, upload.single('image'), async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Category name is required' });

        const exists = await Category.findOne({ name });
        if (exists) return res.status(400).json({ message: 'Category already exists' });

        const count = await Category.countDocuments();

        const newCategory = new Category({
            name,
            imageUrl: req.file?.path || null,
            imagePublicId: req.file?.filename || null,
            order: count,
        });

        await newCategory.save();
        res.status(201).json(newCategory);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Eliminar categoría
router.delete('/:id', authenticateUser, verifyAdmin, csrfProtection, async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        if (category.imagePublicId) {
            await cloudinary.uploader.destroy(category.imagePublicId);
        }
        if (category.imageMobilePublicId) {
            await cloudinary.uploader.destroy(category.imageMobilePublicId);
        }

        res.json({ message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting category' });
    }
});

// Renombrar categoría
router.put('/:id', authenticateUser, verifyAdmin, csrfProtection, async (req, res) => {
    try {
        const { name } = req.body;
        const updated = await Category.findByIdAndUpdate(req.params.id, { name }, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Error renaming category' });
    }
});

// Actualizar imagen desktop
router.put('/:id/image', authenticateUser, verifyAdmin, csrfProtection, upload.single('image'), async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });

        if (category.imagePublicId) {
            await cloudinary.uploader.destroy(category.imagePublicId);
        }

        category.imageUrl = req.file?.path;
        category.imagePublicId = req.file?.filename;
        await category.save();

        res.json(category);
    } catch (err) {
        res.status(500).json({ message: 'Error updating image' });
    }
});

// Actualizar imagen móvil
router.put('/:id/image-mobile', authenticateUser, verifyAdmin, csrfProtection, upload.single('image'), async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Categoría no encontrada' });

        if (category.imageMobilePublicId) {
            await cloudinary.uploader.destroy(category.imageMobilePublicId);
        }

        category.imageMobile = req.file?.path;
        category.imageMobilePublicId = req.file?.filename;

        await category.save();
        res.json({ message: '✅ Imagen móvil actualizada', category });
    } catch (err) {
        console.error("❌ Error al subir imagen móvil:", err);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Reordenar categoría
router.put('/:id/reorder', authenticateUser, verifyAdmin, csrfProtection, async (req, res) => {
    try {
        const { order } = req.body;
        const updated = await Category.findByIdAndUpdate(req.params.id, { order }, { new: true });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: 'Error reordering category' });
    }
});

export default router;
