// routes/StripeRoutes.js
import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();
const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // sk_live o sk_test

// ✅ Valida lo que envías desde el frontend
const CartItemSchema = z.object({
    name: z.string().min(1),
    price: z.union([z.number(), z.string()]), // acepta "1,00" o 1.00
    quantity: z.coerce.number().int().min(1),
    image: z.string().optional().nullable(),
    product: z.string().optional(),
    size: z.string().optional(),
    userId: z.string().optional(),
    email: z.string().email().optional(),
});
const BodySchema = z.object({
    cartItems: z.array(CartItemSchema).min(1),
    userId: z.string().optional(),
});

// ✅ Helper para URLs absolutas
const toAbs = (url) => {
    if (!url) return undefined;
    if (url.startsWith("http")) return url;
    return `https://brand-app.fly.dev${url}`;
};

// ✅ Normaliza precios y asegura mínimo de $0.50
const normalizePrice = (item) => {
    let price =
        typeof item.price === "string"
            ? Number(item.price.replace(",", "."))
            : Number(item.price);

    if (!Number.isFinite(price)) price = 0;

    if (item.name?.toLowerCase().includes("tarifa") && price > 0 && price < 0.5) {
        price = 0.5;
    }

    return price;
};

router.post("/create-checkout-session", async (req, res) => {
    try {
        // 🔎 fallback si CLIENT_URL no está definido
        const clientUrl =
            process.env.CLIENT_URL ||
            (req.headers.origin && req.headers.origin.startsWith("http")
                ? req.headers.origin
                : "https://brand-app.fly.dev");

        console.log("🛒 body:", JSON.stringify(req.body));

        const parsed = BodySchema.safeParse(req.body);
        if (!parsed.success) {
            console.error("❌ Payload inválido:", parsed.error.issues);
            return res
                .status(400)
                .json({ message: "Payload inválido", issues: parsed.error.issues });
        }

        const { cartItems } = parsed.data;

        // 🧾 Construye line_items con validación
        const lineItems = cartItems.map((item) => {
            const price = normalizePrice(item);
            const unit = Math.round(price * 100);
            console.log(`🧾 item="${item.name}" price=${price} unit=${unit}`);

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

        // ⚙️ Configuración de la sesión
        const sessionData = {
            mode: "payment",
            // Puedes usar esto también: automatic_payment_methods: { enabled: true },
            payment_method_types: ["card", "link"],
            line_items: lineItems,
            success_url: `${clientUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${clientUrl}/cart`,
            billing_address_collection: "required",
            shipping_address_collection: { allowed_countries: ["US", "PR"] },
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
            phone_number_collection: { enabled: true },
            customer_creation: "always",
            customer_update: { shipping: "auto", address: "auto" },
            customer_creation: "always",

            // 🧩 Metadata compacta (sin imágenes ni JSON largo)
            metadata: {
                userId: (req.body.userId || cartItems[0]?.userId || "guest")?.trim(),
                email: (cartItems[0]?.email || "").trim(),
                name: (req.body?.name || "").trim(),
                items: cartItems
                    .map(
                        (i) =>
                            `${i.product || "noID"}:${i.quantity}${i.size ? `:${i.size}` : ""
                            }`
                    )
                    .join("|")
                    .slice(0, 480),
            },
        };

        if (cartItems[0]?.email) {
            sessionData.customer_email = cartItems[0].email;
        }

        const session = await stripe.checkout.sessions.create(sessionData);
        return res.json({ id: session.id, url: session.url });
    } catch (error) {
        console.error("💥 Stripe Checkout Error:", {
            type: error?.type,
            code: error?.code,
            message: error?.message,
            raw: error?.raw?.message,
        });
        return res.status(500).json({
            message: "Error creating checkout session",
            code: error?.code || null,
            detail: error?.raw?.message || error?.message || "unknown_error",
        });
    }
});

export default router;
