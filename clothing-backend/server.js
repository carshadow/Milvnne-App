// server.js
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Si prefieres, puedes usar el paquete cors en lugar del bloque manual:
// import cors from "cors";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

console.log("🔧 Boot: iniciando servidor...");

// --- Health check (no depende de DB) ---
app.get("/health", (req, res) => {
    res.json({ ok: true, env: process.env.NODE_ENV || "dev" });
});

// --- CORS manual (para tu frontend en Fly) ---
const allowedOrigins = [
    "http://localhost:3000",
    "https://brand-app.fly.dev",
    "https://clothing-backend.fly.dev",
];

// Si quieres usar cors package:
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

// --- Stripe webhook ANTES de express.json() ---
import stripeWebhookRoutes from "./routes/stripeWebhook.js";
app.use("/api/stripe/webhook", stripeWebhookRoutes);

// --- Middlewares principales ---
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET, { signed: true }));

// --- Static: uploads ---
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use("/uploads", express.static(uploadDir));

// --- Conexión MongoDB ---
const mongoUri = process.env.MONGO_URI || "";
const safeUri = mongoUri.replace(/\/\/.*:.*@/, "//<USER>:<PASS>@");
console.log("🔎 MONGO_URI:", safeUri);

if (!mongoUri) {
    console.warn("⚠️  MONGO_URI no está definido. Continuando sin DB (solo /health funcionará).");
} else {
    console.log("🔗 Conectando a Mongo...");
    mongoose
        .connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            maxPoolSize: 10,
        })
        .then(() => console.log("✅ MongoDB connected"))
        .catch((err) => {
            console.error("❌ MongoDB connection error:", err.message);
            // No cerramos el proceso para que /health siga respondiendo en Fly
        });
}

// --- Rutas de la app ---
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import StripeRoutes from "./routes/StripeRoutes.js"; // expone /create-checkout-session
import categoryRoutes from "./routes/categoryRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// Logger simple
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/stripe", StripeRoutes); // 👈 en minúscula (coincide con el frontend)
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);

// --- 404 ---
app.use((_req, res) => {
    res.status(404).json({ message: "API route not found" });
});

// --- Arranque ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
