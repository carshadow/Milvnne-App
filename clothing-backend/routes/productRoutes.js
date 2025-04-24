
import express from "express";
import multer from "multer";
import Product from "../models/Product.js";
import { authenticateUser, verifyAdmin } from "../middlewares/authMiddleware.js";
import { storage } from "../config/cloudinary.js"; // Asegúrate de tener este archivo

const router = express.Router();
const upload = multer({ storage });

// Obtener todos los productos
router.get("/", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener productos" });
    }
});

// Obtener producto por ID
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Producto no encontrado" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener producto" });
    }
});

// Crear producto
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

            if (!name || !price || !category || !description) {
                return res.status(400).json({ message: "Todos los campos son requeridos" });
            }

            const parsedHasSizes = hasSizes === "true";

            const coverImage = req.files["coverImage"]?.[0]?.path || "";
            const hoverImage = req.files["hoverImage"]?.[0]?.path || "";
            const images = req.files["images"]?.map((img) => img.path) || [];

            let parsedSizes = { S: 0, M: 0, L: 0, XL: 0 };
            if (parsedHasSizes && sizes) {
                parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
            }

            const newProduct = new Product({
                name,
                price,
                category,
                description,
                hasSizes: parsedHasSizes,
                sizes: parsedHasSizes ? parsedSizes : { S: 0, M: 0, L: 0, XL: 0 },
                stock: parsedHasSizes ? 0 : Number(stock),
                coverImage,
                hoverImage,
                images,
            });

            await newProduct.save();
            res.status(201).json({ message: "✅ Producto creado", product: newProduct });
        } catch (error) {
            console.error("❌ Error al crear producto:");

            // Muestra el contenido completo del error como string legible
            try {
                console.error(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            } catch (jsonErr) {
                console.error("Error al hacer JSON.stringify del error:", jsonErr);
                console.error(error);
            }

            res.status(500).json({
                message: error.message || "❌ Error interno del servidor",
            });
        }
    }
);

// Editar producto
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
            const { name, price, category, description, sizes, discount, originalPrice } = req.body;

            const coverImage = req.files["coverImage"]?.[0]?.path;
            const images = req.files["images"]?.map((img) => img.path) || [];

            const product = await Product.findById(req.params.id);
            if (!product) return res.status(404).json({ message: "Producto no encontrado" });

            const parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;

            const updatedProduct = await Product.findByIdAndUpdate(
                req.params.id,
                {
                    name,
                    price,
                    discount: discount || 0,
                    originalPrice: originalPrice || price,
                    category,
                    description,
                    sizes: parsedSizes,
                    coverImage: coverImage || product.coverImage,
                    images: images.length > 0 ? images : product.images,
                },
                { new: true }
            );

            res.json({ message: "✅ Producto actualizado", product: updatedProduct });
        } catch (error) {
            console.error("❌ Error al actualizar producto:", error);
            res.status(500).json({ message: "❌ Error interno del servidor" });
        }
    }
);

// Eliminar producto
router.delete("/:id", authenticateUser, verifyAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Producto no encontrado" });

        await product.deleteOne();
        res.json({ message: "✅ Producto eliminado correctamente" });
    } catch (error) {
        console.error("❌ Error al eliminar producto:", error);
        res.status(500).json({ message: "❌ Error interno del servidor" });
    }
});

export default router;
