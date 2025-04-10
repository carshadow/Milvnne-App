import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import StripeRoutes from "./routes/StripeRoutes.js";
import categoryRoutes from './routes/categoryRoutes.js';
import stripeWebhookRoutes from './routes/stripeWebhook.js';



// 🔹 Obtener __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use('/api/stripe/webhook', stripeWebhookRoutes);
app.use(express.json());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(cookieParser());

// 📌 Crear la carpeta "uploads" si no existe
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 📌 Servir archivos estáticos desde "uploads"
app.use("/uploads", express.static(uploadDir));

// Conectar a MongoDB
mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1);
    });

// Importar rutas
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from './routes/cartRoutes.js'; // Asegúrate de importar la ruta correctamente

// Usar las rutas
app.use("/api/cart", cartRoutes);

// Usar rutas
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/Stripe", StripeRoutes);
app.use('/api/categories', categoryRoutes);
// Middleware para manejar rutas no encontradas
app.use((req, res) => {
    res.status(404).json({ message: "API route not found" });
});

// Iniciar Servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
