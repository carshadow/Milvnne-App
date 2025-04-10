import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticateUser = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) return res.status(401).json({ message: "Unauthorized - No token found" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) return res.status(404).json({ message: "User not found" });

        req.user = user;
        next();
    } catch (error) {
        console.error("❌ Auth Error:", error);
        res.status(401).json({ message: "Unauthorized - Invalid token" });
    }
};

// 📌 Middleware para verificar si el usuario es administrador
export const verifyAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ message: "Access denied - Admins only" });
    }
    next();
};
