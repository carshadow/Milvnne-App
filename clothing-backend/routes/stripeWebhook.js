import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

dotenv.config();
const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const metadata = session.metadata;

        const userId = metadata.userId;
        const isValidUser = userId && userId !== "guest";
        const address = metadata.address || "No address";
        const rawItems = JSON.parse(metadata.items); // items = [{ product, quantity, size }]
        const totalAmount = session.amount_total / 100;

        try {
            // 🔎 Limpiar datos para la orden
            const cleanItems = rawItems.map(item => ({
                product: item.product,
                quantity: item.quantity,
                size: item.size
            }));

            // 🧾 Guardar la orden
            const order = new Order({
                user: isValidUser ? userId : undefined,
                products: cleanItems,
                total: totalAmount,
                address,
                status: "Paid"
            });

            await order.save();
            console.log('✅ Orden creada exitosamente desde webhook');

            // 📉 Actualizar stock (tallas o stock general)
            for (const item of cleanItems) {
                const { product, quantity, size } = item;

                const dbProduct = await Product.findById(product);
                if (!dbProduct) {
                    console.warn(`⚠️ Producto no encontrado: ${product}`);
                    continue;
                }

                if (dbProduct.hasSizes && size) {
                    if (dbProduct.sizes[size] !== undefined) {
                        dbProduct.sizes[size] = Math.max(dbProduct.sizes[size] - quantity, 0);
                        console.log(`🧵 Stock actualizado con tallas: ${dbProduct.name} - ${size} = ${dbProduct.sizes[size]}`);
                    } else {
                        console.warn(`⚠️ Talla '${size}' no encontrada para el producto ${dbProduct.name}`);
                    }
                } else {
                    dbProduct.stock = Math.max((dbProduct.stock || 0) - quantity, 0);
                    console.log(`📦 Stock general actualizado: ${dbProduct.name} = ${dbProduct.stock}`);
                }

                await dbProduct.save();
            }

        } catch (err) {
            console.error('❌ Error guardando la orden o actualizando el stock:', err);
        }
    }

    res.json({ received: true });
});

export default router;
