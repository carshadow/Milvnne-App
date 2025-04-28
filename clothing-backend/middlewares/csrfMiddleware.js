import csrf from "csurf";

export const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    },
    ignoreMethods: ["GET", "HEAD", "OPTIONS"],
});
