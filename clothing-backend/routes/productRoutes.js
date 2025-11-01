import express from "express";
import multer from "multer";
import Product from "../models/product.js";
import { authenticateUser, verifyAdmin } from "../middlewares/authMiddleware.js";
import { storage } from "../config/cloudinary.js";
import { z } from "zod";

const router = express.Router();
const upload = multer({ storage });

// 🧠 Esquema de validación de producto
const productSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    price: z.coerce.number({ invalid_type_error: "El precio debe ser un número" }),
    category: z.string().min(1, "La categoría es requerida"),
    description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
    hasSizes: z.coerce.boolean().optional(),
    stock: z.coerce.number().optional(),
    sizes: z.record(z.string(), z.coerce.number().min(0, "No puede ser menor a 0")).optional(),
});

// ✅ Obtener todos los productos (público)
router.get("/", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener productos" });
    }
});

// ✅ Obtener producto por ID (público)
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Producto no encontrado" });
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener producto" });
    }
});

// ✅ Crear producto (protegido)
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
            // --- Parseo y casteo seguro ---
            const raw = req.body;
            const hasSizes =
                typeof raw.hasSizes === "boolean"
                    ? raw.hasSizes
                    : raw.hasSizes === "true";

            const sizesParsed = raw.sizes
                ? (typeof raw.sizes === "string" ? JSON.parse(raw.sizes) : raw.sizes)
                : undefined;

            const parsed = {
                name: (raw.name || "").trim(),
                price: Number(raw.price || 0),
                category: (raw.category || "").trim(),
                description: raw.description || "",
                hasSizes,
            };

            // Validación básica previa (si usas zod puedes mantenerlo pero con estos valores ya casteados)
            if (!parsed.name) return res.status(400).json({ message: "Nombre requerido" });
            if (!parsed.category) return res.status(400).json({ message: "Categoría requerida" });
            if (!parsed.price) return res.status(400).json({ message: "Precio requerido" });

            // --- Inventario: o tallas o stock (nunca ambos) ---
            if (hasSizes) {
                parsed.sizes = {
                    S: Number(sizesParsed?.S || 0),
                    M: Number(sizesParsed?.M || 0),
                    L: Number(sizesParsed?.L || 0),
                    XL: Number(sizesParsed?.XL || 0),
                };
                parsed.stock = 0;
            } else {
                parsed.stock = Number(raw.stock || 0);
                parsed.sizes = undefined; // 👈 CLAVE: no guardes sizes
            }

            // --- Imágenes desde Cloudinary/multer ---
            const coverImage = req.files["coverImage"]?.[0]?.path || "";
            const hoverImage = req.files["hoverImage"]?.[0]?.path || "";
            const images = req.files["images"]?.map(f => f.path) || [];

            const doc = await Product.create({
                ...parsed,
                coverImage,
                hoverImage,
                images,
            });

            // Normaliza la salida (opcional)
            const out = doc.toObject();
            if (!out.hasSizes) delete out.sizes; // evita confusión en el front
            return res.status(201).json(out);
        } catch (err) {
            console.error("❌ Error creando producto:", err);
            return res.status(500).json({ message: "Error interno del servidor" });
        }
    }
);


// ✅ Editar producto (protegido)
router.put(
    "/:id",
    authenticateUser,
    verifyAdmin,
    upload.fields([
        { name: "coverImage", maxCount: 1 },
        { name: "hoverImage", maxCount: 1 },
        { name: "images", maxCount: 4 },
    ]),
    async (req, res) => {
        try {
            const raw = req.body;
            const hasSizes =
                typeof raw.hasSizes === "boolean"
                    ? raw.hasSizes
                    : raw.hasSizes === "true";

            const sizesParsed = raw.sizes
                ? (typeof raw.sizes === "string" ? JSON.parse(raw.sizes) : raw.sizes)
                : undefined;

            const product = await Product.findById(req.params.id);
            if (!product) return res.status(404).json({ message: "Producto no encontrado" });

            const updates = {
                name: (raw.name ?? product.name).trim(),
                price: Number(raw.price ?? product.price),
                category: (raw.category ?? product.category).trim(),
                description: raw.description ?? product.description,
                hasSizes,
            };

            if (hasSizes) {
                updates.sizes = {
                    S: Number(sizesParsed?.S || 0),
                    M: Number(sizesParsed?.M || 0),
                    L: Number(sizesParsed?.L || 0),
                    XL: Number(sizesParsed?.XL || 0),
                };
                updates.stock = 0;
            } else {
                updates.stock = Number(raw.stock ?? product.stock ?? 0);
                updates.sizes = undefined; // 👈 CLAVE
            }

            // imágenes
            const coverImage = req.files["coverImage"]?.[0]?.path;
            const hoverImage = req.files["hoverImage"]?.[0]?.path;
            const newImages = req.files["images"]?.map(f => f.path) || [];
            const existingImages = Array.isArray(raw.existingImages)
                ? raw.existingImages
                : (raw.existingImages ? [raw.existingImages] : []);

            updates.coverImage = coverImage || product.coverImage;
            updates.hoverImage = hoverImage || product.hoverImage;
            updates.images = [...existingImages, ...newImages];

            const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
            const out = updated.toObject();
            if (!out.hasSizes) delete out.sizes;
            return res.json(out);
        } catch (err) {
            console.error("❌ Error actualizando producto:", err);
            return res.status(500).json({ message: "Error interno del servidor" });
        }
    }
);



// ✅ Eliminar producto (protegido)
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
