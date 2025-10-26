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

export const sendAdminNotificationEmail = async (adminEmail, order) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"MILVNNE Orders" <${process.env.EMAIL_USER}>`,
            to: adminEmail,
            subject: `🛍️ Nueva orden recibida - ${order.name || "Cliente desconocido"}`,
            html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #f8f9fa;">
            <h2 style="color: #e91e63;">Nueva orden en MILVNNE</h2>
            <p><strong>Cliente:</strong> ${order.name || "N/A"}</p>
            <p><strong>Email:</strong> ${order.email || "N/A"}</p>
            <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
            <p><strong>Estado inicial:</strong> ${order.status}</p>
            <p><strong>Dirección:</strong> ${order.address}</p>
  
            <h3>🧾 Productos:</h3>
            <ul>
              ${order.products
                    .map(
                        (item) =>
                            `<li>${item.quantity}x ${item.product?.name || "Producto"} ${item.size ? `(${item.size})` : ""
                            }</li>`
                    )
                    .join("")}
            </ul>
  
            <p style="margin-top: 20px;">🕒 Fecha: ${new Date(order.createdAt).toLocaleString()}</p>
          </div>
        `,
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ Email de notificación enviado al admin");
    } catch (error) {
        console.error("❌ Error enviando correo al admin:", error);
    }
};

