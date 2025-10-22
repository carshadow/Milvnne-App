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
    price: z.union([z.number(), z.string()]),
    quantity: z.coerce.number().int().min(1),
    image: z.string().optional().nullable(),
    // opcionales para metadata
    product: z.string().optional(),
    size: z.string().optional(),
    userId: z.string().optional(),
    email: z.string().email().optional(),
});
const BodySchema = z.object({
    cartItems: z.array(CartItemSchema).min(1),
    userId: z.string().optional(),
    email: z.string().email().optional().nullable(),
    name: z.string().optional().nullable(),
});

// Helper imágenes absolutas
const toAbs = (url) => {
    if (!url) return undefined;
    if (url.startsWith("http")) return url;
    return `https://brand-app.fly.dev${url}`;
};

// Normaliza precio (y mínimo $0.50 por línea)
const normalizePrice = (item) => {
    let price =
        typeof item.price === "string" ? Number(item.price.replace(",", ".")) : Number(item.price);
    if (!Number.isFinite(price)) price = 0;

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
            return res.status(400).json({ message: "Payload inválido", issues: parsed.error.issues });
        }

        const { cartItems, userId, email: bodyEmail, name: bodyName } = parsed.data;

        // line_items
        const lineItems = cartItems.map((item) => {
            const price = normalizePrice(item);
            const unit = Math.round(price * 100);
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

        // email preferido: top-level o del primer item
        const email = (bodyEmail || cartItems[0]?.email || "").trim();
        const name = (bodyName || "").trim();

        // 🎯 AQUÍ forzamos direcciones (funciona también con Link)
        const sessionData = {
            mode: "payment",
            // Puedes dejar que Stripe gestione métodos automáticamente (incluye Link y Card):
            automatic_payment_methods: { enabled: true },

            // si prefieres explícitos:
            // payment_method_types: ["card", "link"],

            line_items: lineItems,
            success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/cart`,

            // 🔒 forzar direcciones
            billing_address_collection: "required",
            shipping_address_collection: { allowed_countries: ["US", "PR"] },

            // 📦 obliga el paso de envío (Checkout siempre mostrará "Shipping")
            shipping_options: [
                {
                    shipping_rate_data: {
                        type: "fixed_amount",
                        fixed_amount: { amount: 0, currency: "usd" },
                        display_name: "Standard",
                        delivery_estimate: {
                            minimum: { unit: "business_day", value: 3 },
                            maximum: { unit: "business_day", value: 7 },
                        },
                    },
                },
            ],

            // 📞 datos extra y customer
            phone_number_collection: { enabled: true },
            customer_creation: "always",
            customer_update: { shipping: "auto", address: "auto" },

            // 🧾 metadata para el webhook
            metadata: {
                userId: (userId || cartItems[0]?.userId || "guest").trim(),
                email: email || "",
                name: name || "",
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

        // Prefill de email (mejora UX y vincula Customer)
        if (email) sessionData.customer_email = email;

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
