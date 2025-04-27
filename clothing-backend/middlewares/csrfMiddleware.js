// middlewares/csrfMiddleware.js
import csrf from "csurf";

export const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Solo en producción se activa secure
        sameSite: "Strict", // Previene ataques Cross-Site
    },
    ignoreMethods: ["GET", "HEAD", "OPTIONS"],
});
