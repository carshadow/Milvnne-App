// routes/StripeRoutes.js
import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();
const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // sk_live o sk_test

// =======================
// Zod: valida payload
// =======================
const CartItemSchema = z.object({
    name: z.string().min(1),
    price: z.union([z.number(), z.string()]), // acepta "1,00" o 1.00
    quantity: z.coerce.number().int().min(1),
    image: z.string().optional().nullable(),

    // opcionales (para metadata y backoffice)
    product: z.string().optional(), // ID de producto en tu DB
    size: z.string().optional(),
    userId: z.string().optional(),
    email: z.string().email().optional(),
});

const BodySchema = z.object({
    cartItems: z.array(CartItemSchema).min(1),
    userId: z.string().optional(),
});

// =======================
// Helpers
// =======================
const toAbs = (url) => {
    if (!url) return undefined;
    if (url.startsWith("http")) return url;
    return `https://brand-app.fly.dev${url}`;
};

const normalizePrice = (item) => {
    let price =
        typeof item.price === "string"
            ? Number(item.price.replace(",", "."))
            : Number(item.price);

    if (!Number.isFinite(price)) price = 0;

    // Mínimo $0.50 solo aplica a líneas tipo "Tarifa"
    if (item.name?.toLowerCase().includes("tarifa") && price > 0 && price < 0.5) {
        price = 0.5;
    }

    return price;
};

// =======================
// POST /create-checkout-session
// =======================
router.post("/create-checkout-session", async (req, res) => {
    try {
        // Fallback sensato si no tienes CLIENT_URL en env
        const clientUrl =
            process.env.CLIENT_URL ||
            (req.headers.origin?.startsWith("http") ? req.headers.origin : "https://brand-app.fly.dev");

        // Valida entrada
        const parsed = BodySchema.safeParse(req.body);
        if (!parsed.success) {
            console.error("❌ Payload inválido:", parsed.error.issues);
            return res
                .status(400)
                .json({ message: "Payload inválido", issues: parsed.error.issues });
        }

        const { cartItems, userId } = parsed.data;

        // Debug útil (dejar temporalmente)
        console.log("[Checkout] cartItems:", cartItems.map(i => ({
            product: i.product, name: i.name, qty: i.quantity, price: i.price
        })));

        // Construye line_items para Stripe (y valida mínimos)
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

        // Crea sesión de Checkout
        const sessionData = {
            mode: "payment",
            payment_method_types: ["card", "link"], // Link + tarjeta
            line_items: lineItems,
            success_url: `${clientUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${clientUrl}/cart`,

            // 🔒 Fuerza dirección aunque usen Link
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

            // ⚠️ NO usar customer_update sin 'customer' explícito
            customer_creation: "always",
            // customer_update: { shipping: "auto", address: "auto" }, // <- Dejar comentado si NO pasas `customer`

            // 🧩 Metadata compacta: SOLO productos reales (sin tarifa)
            metadata: {
                userId: (userId || cartItems[0]?.userId || "guest")?.trim(),
                email: (cartItems[0]?.email || "").trim(),
                name: (req.body?.name || "").trim(),
                items: cartItems
                    .filter(i => !!i.product)
                    .map(i => `${i.product}:${i.quantity}${i.size ? `:${i.size}` : ""}`)
                    .join("|")
                    .slice(0, 480),
            },
        };

        if (cartItems[0]?.email) {
            sessionData.customer_email = cartItems[0].email;
        }

        // Debug flags
        console.log("[Checkout] flags:", {
            billing_address_collection: sessionData.billing_address_collection,
            hasShippingAddressCollection: !!sessionData.shipping_address_collection,
            hasShippingOptions: !!sessionData.shipping_options?.length,
        });

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
