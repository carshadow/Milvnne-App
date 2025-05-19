import csrf from "csurf";

export const csrfProtection = csrf({
    cookie: false,
    ignoreMethods: ["GET", "HEAD", "OPTIONS"],
});
