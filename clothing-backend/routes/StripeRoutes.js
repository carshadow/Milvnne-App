// routes/StripeRoutes.js
import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();
const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // sk_...

// ✅ Valida exactamente lo que envías desde el frontend
const CartItemSchema = z.object({
    name: z.string().min(1),
    price: z.union([z.number(), z.string()]), // acepta "1,00" o 1.00
    quantity: z.coerce.number().int().min(1),
    image: z.string().optional().nullable(),
    // opcionales a metadata
    product: z.string().optional(),
    size: z.string().optional(),
    userId: z.string().optional(),
    email: z.string().email().optional(),
});
const BodySchema = z.object({ cartItems: z.array(CartItemSchema).min(1) });

// ✅ Helper para URLs de imagen
const toAbs = (url) => {
    if (!url) return undefined;
    if (url.startsWith("http")) return url;
    return `https://brand-app.fly.dev${url}`;
};

// ✅ Normaliza price: soporta "1,00" y fuerza mínimo $0.50 SOLO a la tarifa
const normalizePrice = (item) => {
    let price =
        typeof item.price === "string"
            ? Number(item.price.replace(",", "."))
            : Number(item.price);

    if (!Number.isFinite(price)) price = 0;

    // Si es la línea "Tarifa de servicio" y es > 0 pero < 0.50, súbela a 0.50
    if (item.name?.toLowerCase().includes("tarifa") && price > 0 && price < 0.5) {
        price = 0.5;
    }

    return price;
};

router.post("/create-checkout-session", async (req, res) => {
    try {
        console.log("🛒 body:", JSON.stringify(req.body));

        const parsed = BodySchema.safeParse(req.body);
        if (!parsed.success) {
            console.error("❌ Payload inválido:", parsed.error.issues);
            return res
                .status(400)
                .json({ message: "Payload inválido", issues: parsed.error.issues });
        }
        const { cartItems } = parsed.data;

        // ✅ Construye line_items con normalización y validación de mínimo $0.50 por línea
        const lineItems = cartItems.map((item) => {
            const price = normalizePrice(item);
            const unit = Math.round(price * 100); // centavos

            // Stripe exige >= $0.50 por cada línea
            if (!Number.isInteger(unit) || unit < 50) {
                throw new Error(`unit_amount inválido para "${item.name}": ${unit}`);
            }

            return {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: item.name,
                        images: toAbs(item.image) ? [toAbs(item.image)] : undefined,
                    },
                    unit_amount: unit,
                },
                quantity: item.quantity,
            };
        });

        const sessionData = {
            mode: "payment",
            payment_method_types: ["card"],
            line_items: lineItems,
            success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/cart`,
            metadata: {
                userId: cartItems[0]?.userId || "guest",
                items: JSON.stringify(
                    cartItems.map((i) => ({
                        product: i.product,
                        quantity: i.quantity,
                        size: i.size,
                        coverImage: i.image,
                    }))
                ),
            },
        };

        if (cartItems[0]?.email) {
            sessionData.customer_email = cartItems[0].email;
        }

        const session = await stripe.checkout.sessions.create(sessionData);
        return res.json({ id: session.id, url: session.url });
    } catch (error) {
        console.error("💥 Stripe Checkout Error:", error?.type || "", error?.message || error);
        return res.status(500).json({
            message: "Error creating checkout session",
            detail: error?.message,
        });
    }
});

export default router;
