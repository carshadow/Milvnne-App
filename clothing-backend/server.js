// server.js
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// (Opcional) si luego quieres reactivar CORS manual, puedes volver a ponerlo
// import cors from "cors";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

console.log("🔧 Boot: iniciando servidor...");

// ✅ Health check simple (NO depende de la DB)
app.get("/health", (req, res) => {
    res.json({ ok: true, env: process.env.NODE_ENV || "dev" });
});

// ✅ Lista de dominios permitidos (si usas CORS manual)
const allowedOrigins = [
    "http://localhost:3000",
    "https://brand-app.fly.dev",
    "https://clothing-backend.fly.dev",
];

// ✅ Middleware CORS manual (Fly y Postman no lo necesitan, pero tu frontend sí).
// Si prefieres usar el paquete cors:
// app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use((req, res, next) => {
    const origin = req.headers.origin || "";
    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization, CSRF-Token"
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(200);
    next();
});

app.options("*", (req, res) => {
    const origin = req.headers.origin || "";
    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization, CSRF-Token"
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    return res.sendStatus(200);
});

// ✅ Stripe webhook debe ir ANTES de express.json()
// Asegúrate que dentro de ./routes/stripeWebhook.js uses express.raw({ type: 'application/json' })
import stripeWebhookRoutes from "./routes/stripeWebhook.js";
app.use("/api/stripe/webhook", stripeWebhookRoutes);

// ✅ Middlewares principales
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET, { signed: true }));

// ✅ Carpeta uploads (estática)
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use("/uploads", express.static(uploadDir));

// ✅ Conexión MongoDB (sin opciones deprecadas + fail-fast)
const mongoUri = process.env.MONGO_URI || "";
const safeUri = mongoUri.replace(/\/\/.*:.*@/, "//<USER>:<PASS>@");
console.log("🔎 MONGO_URI:", safeUri);

if (!mongoUri) {
    console.warn("⚠️  MONGO_URI no está definido. Continuando sin DB (solo /health funcionará).");
} else {
    console.log("🔗 Conectando a Mongo...");
    mongoose
        .connect(mongoUri, {
            serverSelectionTimeoutMS: 5000, // falla rápido si no encuentra el cluster
            maxPoolSize: 10,
        })
        .then(() => console.log("✅ MongoDB connected"))
        .catch((err) => {
            console.error("❌ MongoDB connection error:", err.message);
            // NO hacemos process.exit(1) para no tumbar el contenedor; /health seguirá respondiendo
        });
}

// ✅ Rutas de la app
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import StripeRoutes from "./routes/StripeRoutes.js"; // OJO: ruta quedará /api/Stripe (S mayúscula)
import categoryRoutes from "./routes/categoryRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// Logger simple para ver qué llega
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/Stripe", StripeRoutes); // si prefieres minúscula, cambia también en el 
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);

// ✅ Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({ message: "API route not found" });
});

// ✅ Iniciar servidor (Fly espera 0.0.0.0:${PORT})
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
