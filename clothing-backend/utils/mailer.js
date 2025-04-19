import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // tu correo de Gmail
        pass: process.env.EMAIL_PASS, // tu App Password
    },
});

export const sendOrderEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: `"MILVNNE Studios" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log("✅ Email enviado a", to);
    } catch (err) {
        console.error("❌ Error sending email:", err);
    }
};
