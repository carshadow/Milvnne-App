import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || "";
        const [type, token] = authHeader.split(" ");

        if (type !== "Bearer" || !token) {
            return res.status(401).json({ message: "No token provided" });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET); // { userId, isAdmin, iat, exp }
        } catch (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(401).json({ message: "Token expired" });
            }
            return res.status(401).json({ message: "Invalid token" });
        }

        const user = await User.findById(decoded.userId).select("_id name email isAdmin");
        if (!user) {
            // Puedes devolver 401 para consistencia en auth en vez de 404
            return res.status(401).json({ message: "User not found" });
        }

        req.user = {
            userId: user._id.toString(),
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
        };

        next();
    } catch (error) {
        console.error("Auth error:", error);
        res.status(401).json({ message: "Unauthorized" });
    }
};

// Solo admins
export const verifyAdmin = (req, res, next) => {
    if (!req.user?.isAdmin) {
        return res.status(403).json({ message: "Access denied - Admins only" });
    }
    next();
};
