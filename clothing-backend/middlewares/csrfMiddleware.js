import csrf from "csurf";

export const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "None", // ✅ para permitir frontend y backend separados
    },
    ignoreMethods: ["GET", "HEAD", "OPTIONS"],
});