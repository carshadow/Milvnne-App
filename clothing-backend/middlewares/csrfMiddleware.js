// middlewares/csrfMiddleware.js
import csrf from "csurf";

export const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        secure: true,          // 🔥 Requerido por Fly.io (HTTPS)
        sameSite: "None",       // 🔥 Necesario porque tu frontend está en otro dominio
        signed: true            // 🔥 MUY MUY IMPORTANTE porque tus cookies están firmadas
    },
    ignoreMethods: ["GET", "HEAD", "OPTIONS"],
});
