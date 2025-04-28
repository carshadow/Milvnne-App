import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { csrfProtection } from "./middlewares/csrfMiddleware.js";


// 🔹 Obtener __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();

// ✅ Webhook de Stripe debe ir antes de express.json()
import stripeWebhookRoutes from './routes/stripeWebhook.js';
app.use('/api/stripe/webhook', stripeWebhookRoutes); // 👈 Este debe estar antes
const allowedOrigins = [
    "http://localhost:3000", // 👈 para desarrollo local
    "https://brand-app.fly.dev", // 👈 tu frontend deploy en producción
    "https://tu-dominio.com", // 👈 si compraste dominio propio
];

app.use(cors({
    origin: "https://brand-app.fly.dev", // 👈 directamente tu frontend
    credentials: true,
}));


// 🧠 Middlewares generales (después del webhook)
app.use(express.json());
// app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));


app.get("/api/csrf-token", (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// 📦 Crear la carpeta "uploads" si no existe
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use("/uploads", express.static(uploadDir));

// 🌐 Conexión a MongoDB
mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1);
    });

// 🔁 Importar rutas
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from './routes/cartRoutes.js';
import StripeRoutes from "./routes/StripeRoutes.js";
import categoryRoutes from './routes/categoryRoutes.js';
import userRoutes from './routes/userRoutes.js';

// 📌 Usar rutas
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/Stripe", StripeRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);

// ⚠️ Ruta 404 si no se encuentra ninguna
app.use((req, res) => {
    res.status(404).json({ message: "API route not found" });
});

// 🚀 Iniciar servidor
const PORT = process.env.PORT || 8080;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});