import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 📌 Ruta para crear una sesión de pago con Stripe Checkout
router.post("/create-checkout-session", async (req, res) => {
    try {
        const { cartItems } = req.body;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: "No cart items provided" });
        }

        const lineItems = cartItems.map((item) => ({
            price_data: {
                currency: "usd",
                product_data: {
                    name: `${item.name} - ${item.size || "Stock"}`,
                    images: item.image ? [`http://localhost:8080${item.image}`] : []
                },
                unit_amount: Math.round(item.price * 100),
            },
            quantity: item.quantity,
        }));


        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: "http://localhost:3000/success",
            cancel_url: "http://localhost:3000/cart",
            custom_fields: [
                {
                    key: "address",
                    label: {
                        type: "custom",
                        custom: "Dirección de envío"
                    },
                    type: "text",
                    optional: false
                }
            ],
            metadata: {
                userId: cartItems[0]?.userId || "guest",
                items: JSON.stringify(
                    cartItems.map(item => ({
                        product: item.product,
                        quantity: item.quantity,
                        size: item.size
                    }))
                )
            }
        });

        res.json({ id: session.id });
    } catch (error) {
        console.error("❌ Stripe Checkout Error:", error);
        res.status(500).json({ message: "Error creating checkout session", error: error.message });
    }
});

export default router;
