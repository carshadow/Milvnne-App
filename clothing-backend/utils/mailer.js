import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // tu correo Gmail
        pass: process.env.EMAIL_PASS, // App Password
    },
});

// 🧾 Correo para el cliente
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
        console.error("❌ Error enviando email al cliente:", err);
    }
};

// 🧠 Correo para el administrador (con imágenes)
export const sendAdminNotificationEmail = async (adminEmail, order) => {
    try {
        const mailOptions = {
            from: `"MILVNNE Orders" <${process.env.EMAIL_USER}>`,
            to: adminEmail,
            subject: `🛍️ Nueva orden recibida - ${order.name || "Cliente desconocido"}`,
            html: `
        <div style="font-family: Arial, sans-serif; background:#111827; color:#fff; padding:24px; border-radius:12px; max-width:650px; margin:auto;">
          <h2 style="color:#f300b4; text-align:center;">Nueva orden en MILVNNE Studios 🛍️</h2>
          <p><strong>Cliente:</strong> ${order.name || "N/A"}</p>
          <p><strong>Email:</strong> ${order.email || "N/A"}</p>
          <p><strong>Total:</strong> $${order.total?.toFixed(2) || "0.00"}</p>
          <p><strong>Estado inicial:</strong> ${order.status || "Sin estado"}</p>
          <p><strong>Dirección:</strong> ${order.address || "No address"}</p>

          <hr style="border:none; border-top:1px solid #444; margin:24px 0;" />

          <h3 style="color:#f300b4;">🧾 Productos:</h3>
          <ul style="list-style:none; padding:0; margin:0;">
            ${order.products
                    ?.map(
                        (item) => `
                <li style="margin-bottom:16px; background:#1f2937; padding:16px; border-radius:12px; display:flex; gap:16px; align-items:center;">
                  ${item.coverImage
                                ? `<img src="${item.coverImage}" style="width:70px; height:70px; object-fit:cover; border-radius:8px;" />`
                                : ""
                            }
                  <div>
                    <p style="margin:0;"><strong>${item.name || "Producto"}</strong></p>
                    <p style="margin:4px 0 0;">Cantidad: ${item.quantity}${item.size ? ` | Talla: ${item.size}` : ""
                            }</p>
                  </div>
                </li>`
                    )
                    .join("")}
          </ul>

          <hr style="border:none; border-top:1px solid #444; margin:24px 0;" />
          <p style="font-size:14px;">🕒 Fecha: ${new Date(
                        order.createdAt
                    ).toLocaleString()}</p>

          <div style="text-align:center; margin-top:24px;">
            <a href="https://brand-app.fly.dev/admin" target="_blank" 
               style="background:#f300b4; color:#fff; padding:10px 20px; border-radius:8px; text-decoration:none;">
               Ver en Dashboard
            </a>
          </div>

          <p style="font-size:12px; color:#aaa; text-align:center; margin-top:30px;">
            © ${new Date().getFullYear()} MILVNNE Studios. Todos los derechos reservados.
          </p>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ Email de notificación enviado al admin");
    } catch (error) {
        console.error("❌ Error enviando correo al admin:", error);
    }
};
