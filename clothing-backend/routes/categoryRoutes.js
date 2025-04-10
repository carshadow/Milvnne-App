import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Category from '../models/Category.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 📦 Configuración de Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads'));
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
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

        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
        const count = await Category.countDocuments();

        const newCategory = new Category({ name, imageUrl, order: count });
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

        if (category.imageUrl) {
            const filePath = path.join(__dirname, '..', category.imageUrl);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
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

        if (category.imageUrl) {
            const oldPath = path.join(__dirname, '..', category.imageUrl);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        category.imageUrl = `/uploads/${req.file.filename}`;
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
