import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import dotenv from "dotenv";
import { z } from "zod";
import { csrfProtection } from "../middlewares/csrfMiddleware.js";

dotenv.config();
const router = express.Router();

// 📦 Esquemas de validación Zod
const loginSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "Password es requerido"),
});

const registerSchema = z.object({
    name: z.string().min(1, "Nombre es requerido"),
    email: z.string().email("Email inválido"),
    password: z.string().min(6, "Password debe tener mínimo 6 caracteres"),
});

// 📌 **Login de Usuario con Cookies**
router.post("/login", csrfProtection, async (req, res) => {
    try {
        const validation = loginSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                errors: validation.error.errors.map(err => ({
                    path: err.path,
                    message: err.message
                })),
            });
        }

        const { email, password } = validation.data;
        const user = await User.findOne({ email }).select("+password");

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const token = jwt.sign(
            { userId: user._id, isAdmin: user.isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: "14d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: true, // Fly usa HTTPS siempre
            sameSite: "None", // 🧠 Mismo que en CSRF
            maxAge: 14 * 24 * 60 * 60 * 1000, // 14 días
        });
        res.json({ message: "Login successful" });

    } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// 📌 **Ruta para verificar el usuario autenticado**
router.get("/me", authenticateUser, async (req, res) => {
    try {
        res.json(req.user);
    } catch (error) {
        console.error("❌ Error fetching user:", error);
        res.status(500).json({ message: "Error retrieving user data" });
    }
});

// 📌 **Logout para eliminar la cookie**
router.post("/logout", csrfProtection, (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        signed: true,
    });
    res.json({ message: "Logged out successfully" });
});


// 📌 **Registro de Usuario**
router.post("/register", csrfProtection, async (req, res) => {
    try {
        const validation = registerSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                errors: validation.error.errors.map(err => ({
                    path: err.path,
                    message: err.message
                })),
            });
        }

        const { name, email, password } = validation.data;

        if (await User.findOne({ email })) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });

        await user.save();
        res.status(201).json({ message: "User registered successfully" });

    } catch (error) {
        console.error("❌ Error registering user:", error);
        res.status(500).json({ message: "Server error" });
    }
});

export default router;
