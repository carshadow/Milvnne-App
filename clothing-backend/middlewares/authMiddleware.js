import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Token no enviado" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("-password");
        if (!user) return res.status(404).json({ message: "Usuario no encontrado" });

        req.user = user;
        next();
    } catch (error) {
        console.error("Auth error:", error);
        res.status(401).json({ message: "Token inválido" });
    }
};


// 📌 Middleware para verificar si el usuario es administrador
export const verifyAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ message: "Access denied - Admins only" });
    }
    next();
};
