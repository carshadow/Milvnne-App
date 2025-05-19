import csrf from "csurf";

export const csrfProtection = csrf({
    cookie: {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        signed: true,
    },
    ignoreMethods: ["GET", "HEAD", "OPTIONS"],
});
