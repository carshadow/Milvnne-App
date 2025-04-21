// routes/userRoutes.js
import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { authenticateUser } from "../middlewares/authMiddleware.js";

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

export default router;
