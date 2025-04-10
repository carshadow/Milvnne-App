import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

// 📌 **Login de Usuario con Cookies**
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
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
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            maxAge: 14 * 24 * 60 * 60 * 1000,
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
router.post("/logout", (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
});

router.post("/register", async (req, res) => {
    try {
        const { name, email, password } = req.body;

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
