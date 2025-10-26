// routes/stripeWebhook.js
import express from "express";
import Stripe from "stripe";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Order from "../models/Order.js";
import Product from "../models/product.js";
import { sendOrderEmail, sendAdminNotificationEmail } from "../utils/mailer.js";

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Secrets para verificar firmas
const LIVE_SECRET = process.env.STRIPE_WEBHOOK_SECRET_LIVE || process.env.STRIPE_WEBHOOK_SECRET;
const TEST_SECRET = process.env.STRIPE_WEBHOOK_SECRET_TEST; // opcional

router.post("/", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  // Verificación de firma (try live -> try test)
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, LIVE_SECRET);
  } catch (eLive) {
    if (TEST_SECRET) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, TEST_SECRET);
      } catch (eTest) {
        console.error("❌ Webhook signature verification failed:", eLive.message, eTest.message);
        return res.status(400).send("Webhook Error");
      }
    } else {
      console.error("❌ Webhook signature verification failed:", eLive.message);
      return res.status(400).send("Webhook Error");
    }
  }

  console.log("✅ Webhook verificado:", event.type, "livemode:", event.livemode);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      console.log("[WH] session.id:", session.id);
      console.log("[WH] customer_details:", JSON.stringify(session.customer_details, null, 2));
      console.log("[WH] shipping_details:", JSON.stringify(session.shipping_details, null, 2));

      // Idempotencia
      const exists = await Order.findOne({ stripeSessionId: session.id });
      if (exists) {
        console.log("ℹ️ Orden ya existe para session:", session.id);
        return res.status(200).json({ received: true });
      }

      const metadata = session.metadata || {};

      // Quien es el comprador
      const email = session.customer_details?.email || session.customer_email || "";
      const name = session.customer_details?.name || "Cliente anónimo";
      const phone = session.customer_details?.phone || null;

      // Dirección: prioriza shipping; sino, billing
      const shipping = session.shipping_details;
      const billing = session.customer_details?.address;
      const addrObj = shipping?.address || billing || null;

      const address = addrObj
        ? [
          addrObj.line1,
          addrObj.line2,
          addrObj.city,
          addrObj.state,
          addrObj.postal_code,
          addrObj.country,
        ].filter(Boolean).join(", ")
        : "No address";

      // Intenta asociar user
      const metaUserId = metadata.userId;
      let userObjectId = null;

      if (metaUserId && metaUserId !== "guest" && mongoose.Types.ObjectId.isValid(metaUserId)) {
        userObjectId = new mongoose.Types.ObjectId(metaUserId);
      } else if (email) {
        // Fallback: busca por email (puente invitado->usuario)
        try {
          const User = (await import("../models/User.js")).default;
          const u = await User.findOne({ email: new RegExp(`^${email}$`, "i") }).select("_id");
          if (u?._id) userObjectId = u._id;
        } catch (e) {
          console.warn("⚠️ No se pudo buscar usuario por email en webhook:", e.message);
        }
      }

      const totalAmount = (session.amount_total ?? 0) / 100;

      // Reconstruye productos desde metadata.items
      // Formato: "id:qty(:size)|id:qty"
      const itemsStr = (metadata?.items || "").trim();
      let rawItems = [];
      if (itemsStr) {
        rawItems = itemsStr
          .split("|")
          .map(t => {
            const [product, qtyStr, size] = t.split(":");
            return {
              product,
              quantity: Number(qtyStr || 0),
              size: size || undefined,
            };
          })
          .filter(i => i.product && Number.isFinite(i.quantity) && i.quantity > 0);
      }

      console.log("[WH] items parsed:", rawItems);

      // Para guardar en la orden (solo referencias, no imágenes)
      const cleanItems = rawItems.map(i => ({
        product: i.product,
        quantity: i.quantity,
        size: i.size,
      }));

      // Crea orden
      const newOrder = await Order.create({
        stripeSessionId: session.id,
        paymentIntentId: session.payment_intent || null,
        user: userObjectId ?? null,
        products: cleanItems,          // [{ product:ObjectId, quantity, size }]
        total: totalAmount,
        address,
        status: "Paid",
        email,
        name,
        archived: false,
      });

      console.log("✅ Orden guardada:", newOrder._id);

      // Actualiza stock + prepara items para el email (con nombre e imagen)
      const itemsForEmail = [];
      for (const item of cleanItems) {
        try {
          const dbProduct = await Product.findById(item.product);
          if (!dbProduct) {
            console.warn(`⚠️ Producto no encontrado: ${item.product}`);
            continue;
          }

          // Stock / tallas
          if (dbProduct.hasSizes && item.size) {
            if (dbProduct.sizes[item.size] !== undefined) {
              dbProduct.sizes[item.size] = Math.max(
                Number(dbProduct.sizes[item.size] || 0) - Number(item.quantity || 0),
                0
              );
              console.log(`🧵 Stock talla: ${dbProduct.name} - ${item.size} = ${dbProduct.sizes[item.size]}`);
            }
          } else {
            dbProduct.stock = Math.max(Number(dbProduct.stock || 0) - Number(item.quantity || 0), 0);
            console.log(`📉 Stock general: ${dbProduct.name} = ${dbProduct.stock}`);
          }

          await dbProduct.save();

          // Para email
          itemsForEmail.push({
            name: dbProduct.name,
            coverImage: dbProduct.coverImage,
            quantity: item.quantity,
            size: item.size,
          });
        } catch (e) {
          console.warn("⚠️ Error actualizando stock:", e.message);
        }
      }

      // Email de confirmación (si hay email)
      if (email) {
        try {
          const listHtml = itemsForEmail.map(p => `
            <li style="margin-bottom:16px; background:#1f2937; padding:16px; border-radius:12px; display:flex; gap:16px; align-items:center;">
              ${p.coverImage ? `<img src="${p.coverImage}" style="width:70px; height:70px; object-fit:cover; border-radius:8px;" />` : ""}
              <div>
                <p style="margin:0;"><strong>${p.name || "Producto"}</strong></p>
                <p style="margin:4px 0 0;">Cantidad: ${p.quantity}${p.size ? ` | Talla: ${p.size}` : ""}</p>
              </div>
            </li>
          `).join("");

          await sendOrderEmail(
            email,
            "Confirmación de tu orden en MILVNNE Studios",
            `
              <div style="font-family: Helvetica, Arial, sans-serif; background:#111827; color:#fff; padding:24px; border-radius:12px; max-width:600px; margin:auto;">
                <h2 style="color:#f300b4; text-align:center;">¡Gracias por tu compra, ${name}!</h2>
                <p style="margin-top:16px;">Hemos recibido tu orden y ya la estamos procesando.</p>

                <hr style="border:none; border-top:1px solid #444; margin:24px 0;" />
                <h3 style="color:#f300b4;">Detalles:</h3>
                <ul style="list-style:none; padding:0; margin:16px 0;">${listHtml}</ul>

                <hr style="border:none; border-top:1px solid #444; margin:24px 0;" />
                <p><strong>Dirección:</strong> ${address}</p>
                <p><strong>Total:</strong> $${Number(newOrder.total).toFixed(2)}</p>
              </div>
            `,
            // Texto alternativo
            `Gracias por tu compra.\nTotal: $${Number(newOrder.total).toFixed(2)}\n${itemsForEmail.map(p => `- ${p.name} x${p.quantity}${p.size ? ` (${p.size})` : ""}`).join("\n")}`
          );
        } catch (e) {
          console.warn("⚠️ Error enviando email:", e.message);
        }
      }
      try {
        const enrichedOrder = {
          ...newOrder.toObject(),
          products: itemsForEmail, // agrega nombres e imágenes
        };

        await sendAdminNotificationEmail("milvnne@gmail.com", enrichedOrder);
      } catch (e) {
        console.warn("⚠️ Error enviando notificación al admin:", e.message);
      }
    }

    // sends MIlan a email


    // Pagos async (boleto, etc.)
    if (event.type === "checkout.session.async_payment_succeeded") {
      const s = event.data.object;
      await Order.findOneAndUpdate({ stripeSessionId: s.id }, { $set: { status: "Paid" } });
    }

    if (event.type === "checkout.session.async_payment_failed") {
      const s = event.data.object;
      await Order.findOneAndUpdate({ stripeSessionId: s.id }, { $set: { status: "Failed" } });
    }

    if (event.type === "checkout.session.expired") {
      const s = event.data.object;
      await Order.findOneAndUpdate({ stripeSessionId: s.id }, { $set: { status: "Expired" } });
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("❌ Error interno en webhook:", err);
    return res.status(500).send("Webhook handler error");
  }
});

export default router;
