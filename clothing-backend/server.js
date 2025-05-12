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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const app = express();

// ✅ Lista de dominios permitidos
const allowedOrigins = [
    "http://localhost:3000",
    "https://brand-app.fly.dev",
];

// ✅ Middleware CORS
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));

// ✅ Preflight para todos los endpoints
app.options("*", cors({
    origin: allowedOrigins,
    credentials: true
}));

// ✅ Header extra para cookies cross-origin
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", req.headers.origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, CSRF-Token");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    next();
});

// ✅ Stripe webhook debe ir antes del express.json()
import stripeWebhookRoutes from './routes/stripeWebhook.js';
app.use('/api/stripe/webhook', stripeWebhookRoutes);

// ✅ Middlewares principales
app.use(express.json());
app.use(cookieParser(process.env.COOKIE_SECRET, { signed: true }));

// ✅ CSRF Token route
app.get("/api/csrf-token", csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// ✅ Carpeta uploads
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use("/uploads", express.static(uploadDir));

// ✅ Conexión MongoDB
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1);
    });

// ✅ Rutas
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from './routes/cartRoutes.js';
import StripeRoutes from "./routes/StripeRoutes.js";
import categoryRoutes from './routes/categoryRoutes.js';
import userRoutes from './routes/userRoutes.js';

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/Stripe", StripeRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/users", userRoutes);

// ✅ Ruta no encontrada
app.use((req, res) => {
    res.status(404).json({ message: "API route not found" });
});

// ✅ Iniciar servidor
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
