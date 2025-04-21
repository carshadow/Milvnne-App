// routes/userRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import crypto from "crypto";
import nodemailer from "nodemailer";


const router = express.Router();

// PUT /api/users/update-profile
router.put("/update-profile", authenticateUser, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("+password");

        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        if (req.body.name) user.name = req.body.name;
        if (req.body.email) user.email = req.body.email;
        if (req.body.password) {
            const hashed = await bcrypt.hash(req.body.password, 10);
            user.password = hashed;
        }

        await user.save();

        res.json({
            message: "Perfil actualizado correctamente",
            updatedUser: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin,
            },
        });

    } catch (err) {
        console.error("❌ Error al actualizar perfil:", err);
        res.status(500).json({ message: "Error del servidor" });
    }
});

// 👉 1. Solicitar enlace de recuperación
router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hora

    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${token}`;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    await transporter.sendMail({
        from: `"MILVNNE Support" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Recuperación de Contraseña",
        html: `<p>Haz clic en el siguiente enlace para resetear tu contraseña:</p>
               <a href="${resetUrl}">${resetUrl}</a>
               <p>Este enlace expirará en 1 hora.</p>`,
    });

    res.json({ message: "Email de recuperación enviado." });
});

// 👇 2. Resetear contraseña con el token
router.post("/reset-password/:token", async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Token inválido o expirado" });

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Contraseña actualizada correctamente" });
});

export default router;
