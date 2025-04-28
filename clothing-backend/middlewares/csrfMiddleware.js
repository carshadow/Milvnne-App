import csrf from "csurf";

export const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // 🔥 secure solo en producción
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax", // 🔥 None en producción
        domain: process.env.NODE_ENV === "production" ? ".fly.dev" : undefined, // 🔥 MUY IMPORTANTE
    },
    ignoreMethods: ["GET", "HEAD", "OPTIONS"],
});
