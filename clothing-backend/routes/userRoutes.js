import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { z } from "zod";

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

//  Ruta protegida con autenticación y CSRF
router.put("/update-profile", authenticateUser, async (req, res) => {
    try {
        const validatedData = updateProfileSchema.safeParse(req.body);
        if (!validatedData.success) {
            return res.status(400).json({ message: validatedData.error.errors[0].message });
        }

        // 🔧 Acepta cualquiera de las 3 claves
        const userId = req.user._id || req.user.userId || req.user.id;

        const user = await User.findById(userId).select("+password");
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        const { name, email, password } = validatedData.data;

        if (name) user.name = name;
        if (email) user.email = email;
        if (password?.trim()) {
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();

        return res.json({
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
        return res.status(500).json({ message: "Error del servidor" });
    }
});

// POST /forgot-password
router.post("/forgot-password", async (req, res) => {
    try {
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

    } catch (err) {
        console.error("❌ Error en forgot-password:", err);
        res.status(500).json({ message: "Error del servidor" });
    }
});

// POST /reset-password/:token
router.post("/reset-password/:token", async (req, res) => {
    try {
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

    } catch (err) {
        console.error("❌ Error en reset-password:", err);
        res.status(500).json({ message: "Error del servidor" });
    }
});

export default router;
