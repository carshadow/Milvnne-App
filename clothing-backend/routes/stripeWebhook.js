import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import mongoose from "mongoose";
import { sendOrderEmail } from "../utils/mailer.js";

dotenv.config();
const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        console.log('✅ Webhook recibido correctamente');
    } catch (err) {
        console.error('❌ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const metadata = session.metadata;

        // 👇 Verifica si los metadatos vienen correctamente
        console.log("🧠 Metadata recibida:", metadata);

        try {
            const userId = metadata.userId;
            const isValidUser = userId && userId !== "guest" && mongoose.Types.ObjectId.isValid(userId);
            const address = metadata.address || "No address";
            const rawItems = JSON.parse(metadata.items || "[]");

            // 👇 Mostrar los datos crudos de los productos
            console.log("📦 Productos recibidos:", rawItems);
            console.log("👤 userId:", userId);
            console.log("🏠 address:", address);

            const totalAmount = session.amount_total / 100;

            // Formatear productos
            const cleanItems = rawItems.map(item => ({
                product: item.product,
                quantity: item.quantity,
                size: item.size,
                coverImage: item.coverImage
            }));

            console.log("🧽 Productos limpios para guardar:", cleanItems);

            // 🧾 Guardar orden
            const newOrder = new Order({
                user: isValidUser ? new mongoose.Types.ObjectId(userId) : null,
                products: cleanItems,
                total: totalAmount,
                address,
                status: "Paid",
                email: session.customer_email || "",
                name: session.customer_details?.name || "Cliente anónimo",
            });

            await newOrder.save();
            console.log("✅ Orden guardada correctamente en MongoDB con ID:", newOrder._id);
            await sendOrderEmail(
                session.customer_email,
                "✅ Confirmación de tu orden en MILVNNE Studios",
                `
                <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #111827; color: #ffffff; padding: 24px; border-radius: 12px; max-width: 600px; margin: auto;">
                  <h2 style="color: #f300b4; text-align: center;">¡Gracias por tu compra, ${session.customer_details?.name || "cliente"}! 💖</h2>
              
                  <p style="margin-top: 16px; font-size: 15px;">Hemos recibido tu orden en <strong>MILVNNE Studios</strong> y estamos preparando todo para ti.</p>
              
                  <hr style="border: none; border-top: 1px solid #444; margin: 24px 0;" />
              
                  <h3 style="color: #f300b4; font-size: 18px;">🛍 Detalles de tu orden:</h3>
                  <ul style="list-style: none; padding: 0; margin: 16px 0;">
                    ${cleanItems.map(prod => `
                      <li style="margin-bottom: 16px; background-color: #1f2937; padding: 16px; border-radius: 12px; display: flex; gap: 16px; align-items: center;">
                        <img src="${prod.coverImage}" alt="Imagen del producto" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px;" />
                        <div>
                          <p style="margin: 0; font-size: 15px;"><strong>Cantidad:</strong> ${prod.quantity}</p>
                          ${prod.size ? `<p style="margin: 4px 0 0; font-size: 15px;"><strong>Talla:</strong> ${prod.size}</p>` : ""}
                          <p style="margin: 4px 0 0; font-size: 13px; color: #9ca3af;">ID Producto: ${prod.product}</p>
                        </div>
                      </li>
                    `).join("")}
                  </ul>
              
                  <hr style="border: none; border-top: 1px solid #444; margin: 24px 0;" />
              
                  <p style="font-size: 15px;">🕒 Recibirás actualizaciones por correo electrónico cuando el estado de tu orden cambie (por ejemplo: En camino, Entregada, etc).</p>
                  <p style="margin-top: 20px;">Gracias por confiar en <strong style="color: #f300b4;">MILVNNE Studios</strong>. Si tienes preguntas, simplemente responde a este correo.</p>
              
                  <div style="margin-top: 32px; font-size: 12px; color: #9ca3af; text-align: center;">
                    Este correo fue enviado automáticamente. No respondas directamente.
                  </div>
                </div>
                `
            );
            // 📦 Actualizar stock
            for (const item of cleanItems) {
                const dbProduct = await Product.findById(item.product);
                if (!dbProduct) {
                    console.warn(`⚠️ Producto no encontrado en MongoDB: ${item.product}`);
                    continue;
                }

                if (dbProduct.hasSizes && item.size) {
                    if (dbProduct.sizes[item.size] !== undefined) {
                        dbProduct.sizes[item.size] = Math.max(dbProduct.sizes[item.size] - item.quantity, 0);
                        console.log(`🧵 Talla actualizada: ${dbProduct.name} - ${item.size} = ${dbProduct.sizes[item.size]}`);
                    }
                } else {
                    dbProduct.stock = Math.max((dbProduct.stock || 0) - item.quantity, 0);
                    console.log(`📉 Stock general actualizado: ${dbProduct.name} = ${dbProduct.stock}`);
                }

                await dbProduct.save();
            }

        } catch (err) {
            console.error("❌ Error interno al procesar la orden:");
            console.trace(err);
        }
    }

    res.status(200).json({ received: true });
});

export default router;
