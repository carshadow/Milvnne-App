import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import mongoose from "mongoose";

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
            }));

            console.log("🧽 Productos limpios para guardar:", cleanItems);

            // 🧾 Guardar orden
            const newOrder = new Order({
                user: isValidUser ? new mongoose.Types.ObjectId(userId) : null,
                products: cleanItems,
                total: totalAmount,
                address,
                status: "Paid"
            });

            await newOrder.save();
            console.log("✅ Orden guardada correctamente en MongoDB con ID:", newOrder._id);

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
