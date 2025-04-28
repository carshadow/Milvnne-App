import express from "express";
import multer from "multer";
import Product from "../models/product.js";
import { authenticateUser, verifyAdmin } from "../middlewares/authMiddleware.js";
import { storage } from "../config/cloudinary.js";
import { z } from "zod"; // ✅ Importar Zod

const router = express.Router();
const upload = multer({ storage });

// 🧠 Esquema de validación de producto
const productSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    price: z.coerce.number({ invalid_type_error: "El precio debe ser un número" }),
    category: z.string().min(1, "La categoría es requerida"),
    description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
    hasSizes: z.coerce.boolean().optional(), // "true" o "false" string que convertimos
    stock: z.coerce.number().optional(),
    sizes: z.record(z.string(), z.coerce.number().min(0, "No puede ser menor a 0")).optional(),
});

// ✅ Obtener todos los productos
router.get("/", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener productos" });
    }
});

// ✅ Obtener producto por ID
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Producto no encontrado" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener producto" });
    }
});

// ✅ Crear producto
router.post(
    "/",
    authenticateUser,
    verifyAdmin,
    upload.fields([
        { name: "coverImage", maxCount: 1 },
        { name: "hoverImage", maxCount: 1 },
        { name: "images", maxCount: 4 },
    ]),
    async (req, res) => {
        try {
            const { name, price, category, description, sizes, stock, hasSizes } = req.body;

            // Validar con Zod antes de guardar
            const parsed = productSchema.safeParse({
                name,
                price,
                category,
                description,
                hasSizes,
                stock,
                sizes: sizes ? (typeof sizes === "string" ? JSON.parse(sizes) : sizes) : undefined,
            });

            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    errors: parsed.error.errors.map(err => ({
                        path: err.path,
                        message: err.message,
                    })),
                });
            }

            const coverImage = req.files["coverImage"]?.[0]?.path || "";
            const hoverImage = req.files["hoverImage"]?.[0]?.path || "";
            const images = req.files["images"]?.map((img) => img.path) || [];

            const newProduct = new Product({
                name: parsed.data.name,
                price: parsed.data.price,
                category: parsed.data.category,
                description: parsed.data.description,
                hasSizes: parsed.data.hasSizes,
                stock: parsed.data.hasSizes ? 0 : parsed.data.stock,
                sizes: parsed.data.hasSizes ? parsed.data.sizes || { S: 0, M: 0, L: 0, XL: 0 } : { S: 0, M: 0, L: 0, XL: 0 },
                coverImage,
                hoverImage,
                images,
            });

            await newProduct.save();
            res.status(201).json({ message: "✅ Producto creado", product: newProduct });
        } catch (error) {
            console.error("❌ Error al crear producto:", error);
            res.status(500).json({ message: error.message || "Error interno del servidor" });
        }
    }
);

// ✅ Editar producto
router.put(
    "/:id",
    authenticateUser,
    verifyAdmin,
    upload.fields([
        { name: "coverImage", maxCount: 1 },
        { name: "images", maxCount: 4 },
    ]),
    async (req, res) => {
        try {
            const { name, price, category, description, sizes } = req.body;

            // Validar con Zod antes de actualizar
            const parsed = productSchema.safeParse({
                name,
                price,
                category,
                description,
                sizes: sizes ? (typeof sizes === "string" ? JSON.parse(sizes) : sizes) : undefined,
            });

            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    errors: parsed.error.errors.map(err => ({
                        path: err.path,
                        message: err.message,
                    })),
                });
            }

            const coverImage = req.files["coverImage"]?.[0]?.path;
            const images = req.files["images"]?.map((img) => img.path) || [];

            const product = await Product.findById(req.params.id);
            if (!product) return res.status(404).json({ message: "Producto no encontrado" });

            const updatedProduct = await Product.findByIdAndUpdate(
                req.params.id,
                {
                    name: parsed.data.name,
                    price: parsed.data.price,
                    category: parsed.data.category,
                    description: parsed.data.description,
                    sizes: parsed.data.sizes,
                    coverImage: coverImage || product.coverImage,
                    images: images.length > 0 ? images : product.images,
                },
                { new: true }
            );

            res.json({ message: "✅ Producto actualizado", product: updatedProduct });
        } catch (error) {
            console.error("❌ Error al actualizar producto:", error);
            res.status(500).json({ message: "Error interno del servidor" });
        }
    }
);

// ✅ Eliminar producto
router.delete("/:id", authenticateUser, verifyAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Producto no encontrado" });

        await product.deleteOne();
        res.json({ message: "✅ Producto eliminado correctamente" });
    } catch (error) {
        console.error("❌ Error al eliminar producto:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});

export default router;
