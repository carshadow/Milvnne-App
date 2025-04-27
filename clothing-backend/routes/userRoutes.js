// routes/userRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { z } from "zod"; // 👈 Importamos Zod
import { csrfProtection } from "../middlewares/csrfMiddleware.js";

const router = express.Router();

// 🧠 Esquemas de Validación
const updateProfileSchema = z.object({
    name: z.string().min(1, "El nombre es requerido").optional(),
    email: z.string().email("Email inválido").optional(),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres").optional(),
});

const forgotPasswordSchema = z.object({
    email: z.string().email("Email inválido"),
});

const resetPasswordSchema = z.object({
    password: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
});

// ✅ PUT /api/users/update-profile
router.put("/update-profile", authenticateUser, csrfProtection, async (req, res) => {
    try {
        // ✅ Validar datos
        const validatedData = updateProfileSchema.safeParse(req.body);
        if (!validatedData.success) {
            return res.status(400).json({ message: validatedData.error.errors[0].message });
        }

        const user = await User.findById(req.user._id).select("+password");

        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        const { name, email, password } = validatedData.data;

        if (name) user.name = name;
        if (email) user.email = email;
        if (password) {
            const hashed = await bcrypt.hash(password, 10);
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

// ✅ POST /api/users/forgot-password
router.post("/forgot-password", csrfProtection, async (req, res) => {
    const validatedData = forgotPasswordSchema.safeParse(req.body);
    if (!validatedData.success) {
        return res.status(400).json({ message: validatedData.error.errors[0].message });
    }

    const { email } = validatedData.data;
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

// ✅ POST /api/users/reset-password/:token
router.post("/reset-password/:token", csrfProtection, async (req, res) => {
    const validatedData = resetPasswordSchema.safeParse(req.body);
    if (!validatedData.success) {
        return res.status(400).json({
            success: false,
            errors: validatedData.error.errors.map(err => ({
                path: err.path,
                message: err.message,
            })),
        });
    }

    const { password } = validatedData.data;
    const { token } = req.params;

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
