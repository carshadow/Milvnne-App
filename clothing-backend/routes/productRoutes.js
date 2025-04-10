import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import Product from "../models/Product.js";
import { authenticateUser, verifyAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// 📌 Crear la carpeta "uploads" si no existe
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 📌 Configuración de `multer` para guardar las imágenes en el backend
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

const upload = multer({ storage });

// 📌 Servir archivos estáticos de la carpeta `uploads`
router.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// 📌 Obtener todos los productos
router.get("/", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener productos" });
    }
});

// 📌 Obtener un solo producto por ID
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error('❌ Error fetching product:', error);
        res.status(500).json({ message: 'Failed to fetch product' });
    }
});

// 📌 Crear un nuevo producto (Admin)
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
            console.log("🟢 Recibiendo petición para crear producto:", req.body);
            console.log("🟢 Archivos recibidos:", req.files);

            const { name, price, category, description, sizes, stock, hasSizes } = req.body;

            if (!name || !price || !category || !description) {
                return res.status(400).json({ message: "Todos los campos son obligatorios" });
            }

            // Convertir hasSizes a booleano (porque viene como string desde el formulario)
            const parsedHasSizes = hasSizes === 'true';

            // Procesar imágenes
            const coverImage = req.files["coverImage"]
                ? `/uploads/${req.files["coverImage"][0].filename}`
                : null;

            const hoverImage = req.files["hoverImage"]
                ? `/uploads/${req.files["hoverImage"][0].filename}`
                : null;

            const images = req.files["images"]
                ? req.files["images"].map(file => `/uploads/${file.filename}`)
                : [];

            // Parsear tallas si aplica
            let parsedSizes = { S: 0, M: 0, L: 0, XL: 0 };
            if (parsedHasSizes && sizes) {
                try {
                    parsedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
                } catch (err) {
                    console.error("❌ Error al parsear sizes:", err);
                    return res.status(400).json({ message: "Formato inválido en las tallas (sizes)" });
                }
            }

            const newProduct = new Product({
                name,
                price,
                category,
                description,
                hasSizes: parsedHasSizes,
                sizes: parsedHasSizes ? parsedSizes : { S: 0, M: 0, L: 0, XL: 0 },
                stock: parsedHasSizes ? 0 : Number(stock), // solo si no tiene tallas
                coverImage,
                hoverImage,
                images,
            });

            await newProduct.save();
            res.status(201).json({ message: "✅ Producto creado exitosamente", product: newProduct });
        } catch (error) {
            console.error("❌ Error creando producto:", error);
            res.status(500).json({ message: "❌ Error interno del servidor" });
        }
    }
);


// 📌 Editar un producto (Admin)
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

            const coverImage = req.files && req.files["coverImage"]
                ? `/uploads/${req.files["coverImage"][0].filename}`
                : null;

            const images = req.files && req.files["images"]
                ? req.files["images"].map(file => `/uploads/${file.filename}`)
                : [];

            const existingProduct = await Product.findById(req.params.id);
            if (!existingProduct) {
                return res.status(404).json({ message: "❌ Producto no encontrado" });
            }

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
                    coverImage: coverImage || existingProduct.coverImage,
                    images: images.length > 0 ? images : existingProduct.images,
                },
                { new: true }
            );

            res.json({ message: "✅ Producto actualizado exitosamente", product: updatedProduct });
        } catch (error) {
            console.error("❌ Error al actualizar producto:", error);
            res.status(500).json({ message: "❌ Error al actualizar producto" });
        }
    }
);

// 📌 Eliminar un producto (Admin)
router.delete("/:id", authenticateUser, verifyAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "❌ Producto no encontrado" });

        await product.deleteOne();
        res.json({ message: "✅ Producto eliminado correctamente" });
    } catch (error) {
        console.error("❌ Error al eliminar:", error);
        res.status(500).json({ message: "❌ Error en el servidor" });
    }
});

export default router;
