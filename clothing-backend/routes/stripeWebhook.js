// routes/stripeWebhook.js
import express from 'express';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import Order from '../models/Order.js';
import Product from '../models/product.js';
import mongoose from 'mongoose';
import { sendOrderEmail } from '../utils/mailer.js';

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ Usa el secret LIVE (y opcionalmente TEST como fallback)
const LIVE_SECRET = process.env.STRIPE_WEBHOOK_SECRET_LIVE || process.env.STRIPE_WEBHOOK_SECRET;
const TEST_SECRET = process.env.STRIPE_WEBHOOK_SECRET_TEST; // opcional

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  // ✅ Verifica con LIVE; si falla y tienes TEST, intenta TEST (útil si pruebas)
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, LIVE_SECRET);
  } catch (eLive) {
    if (TEST_SECRET) {
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, TEST_SECRET);
      } catch (eTest) {
        console.error('❌ Webhook signature verification failed:', eLive.message, eTest.message);
        return res.status(400).send(`Webhook Error`);
      }
    } else {
      console.error('❌ Webhook signature verification failed:', eLive.message);
      return res.status(400).send(`Webhook Error`);
    }
  }

  console.log('✅ Webhook verificado:', event.type, 'livemode:', event.livemode);

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // ✅ Idempotencia: evita crear/actualizar dos veces
      const already = await Order.findOne({ stripeSessionId: session.id });
      if (already) {
        console.log('ℹ️ Orden ya existente para session:', session.id);
        return res.status(200).json({ received: true });
      }

      const metadata = session.metadata || {};
      console.log('🧠 Metadata recibida:', metadata);
      const email = session.customer_details?.email || session.customer_email || "";
      const name = session.customer_details?.name || "Cliente anónimo";
      const phone = session.customer_details?.phone || null;

      // 📦 Dirección: usa shipping; si no hay, usa billing como fallback
      const shipping = session.shipping_details;             // { name, address:{ line1, line2, city, state, postal_code, country } }
      const billing = session.customer_details?.address;    // fallback
      const addr = shipping?.address || billing || null;

      const address = addr
        ? [addr.line1, addr.line2, addr.city, addr.state, addr.postal_code, addr.country].filter(Boolean).join(", ")
        : "No address";

      const userId = metadata.userId;
      let userObjectId = null;

      if (userId && userId !== "guest" && mongoose.Types.ObjectId.isValid(userId)) {
        userObjectId = new mongoose.Types.ObjectId(userId);
      } else {
        // Fallback: si no vino userId, intenta enlazar por email del checkout
        const email = session.customer_details?.email || session.customer_email || "";
        if (email) {
          try {
            const User = (await import("../models/User.js")).default;
            const u = await User.findOne({ email: new RegExp(`^${email}$`, "i") }).select("_id");
            if (u?._id) userObjectId = u._id;
          } catch (e) {
            console.warn("⚠️ No se pudo buscar usuario por email en webhook:", e.message);
          }
        }
      }

      const isValidUser = userId && userId !== 'guest' && mongoose.Types.ObjectId.isValid(userId);

      // Campos de Checkout
      // const addressField = session.custom_fields?.find((f) => f.key === 'address');
      // const address = addressField?.text?.value || 'No address';

      // ✅ Parseo seguro de items desde metadata
      // 🧩 Parsear items compactos de metadata: "id:qty(:size)|id:qty"
      const itemsStr = (metadata?.items || "").trim();
      let rawItems = [];
      if (itemsStr) {
        rawItems = itemsStr.split("|").map(t => {
          const [product, qtyStr, size] = t.split(":");
          return {
            product,
            quantity: Number(qtyStr || 0),
            size: size || undefined,
          };
        }).filter(i => i.product && Number.isFinite(i.quantity) && i.quantity > 0);
      }


      console.log('📦 Productos recibidos:', rawItems);
      console.log('👤 userId:', userId);
      console.log('🏠 address:', address);

      const totalAmount = (session.amount_total ?? 0) / 100;

      // Normaliza productos
      const cleanItems = rawItems.map((item) => ({
        product: item.product,
        quantity: Number(item.quantity || 0),
        size: item.size,
      }));

      console.log('🧽 Productos limpios para guardar:', cleanItems);

      // 🧾 Crea orden (solo una vez gracias a idempotencia)
      // 🧾 Crea orden (solo una vez gracias a idempotencia)
      const newOrder = await Order.create({
        stripeSessionId: session.id,                       // 👈 clave para no duplicar
        paymentIntentId: session.payment_intent || null,
        user: userObjectId,
        products: cleanItems,
        total: totalAmount,                                // 👈 tu Admin lee "total"
        address,
        status: 'Paid',
        email: session.customer_details?.email || session.customer_email || "",  // 👈 AÑADE ESTO
        name: session.customer_details?.name || "Cliente anónimo",               // 👈 Y ESTO
        archived: false,
      });


      console.log('✅ Orden guardada en MongoDB:', newOrder._id);

      // 📧 Email (no bloqueante si quieres: puedes no esperar)
      try {
        await sendOrderEmail(
          newOrder.email,
          'Confirmación de tu orden en MILVNNE Studios',
          /* HTML */ `
          <div style="font-family: Helvetica, Arial, sans-serif; background:#111827; color:#fff; padding:24px; border-radius:12px; max-width:600px; margin:auto;">
            <h2 style="color:#f300b4; text-align:center;">¡Gracias por tu compra, ${newOrder.name}!</h2>
            <p style="margin-top:16px;">Hemos recibido tu orden y ya la estamos procesando.</p>
            <hr style="border:none; border-top:1px solid #444; margin:24px 0;" />
            <h3 style="color:#f300b4;">Detalles:</h3>
            <ul style="list-style:none; padding:0; margin:16px 0;">
              ${cleanItems
            .map(
              (p) => `
                <li style="margin-bottom:16px; background:#1f2937; padding:16px; border-radius:12px; display:flex; gap:16px; align-items:center;">
                  <img src="${p.coverImage}" style="width:70px; height:70px; object-fit:cover; border-radius:8px;" />
                  <div>
                    <p style="margin:0;"><strong>Cantidad:</strong> ${p.quantity}</p>
                    ${p.size ? `<p style="margin:4px 0 0;"><strong>Talla:</strong> ${p.size}</p>` : ''}
                    <p style="margin:4px 0 0; font-size:12px; color:#9ca3af;">ID Producto: ${p.product}</p>
                  </div>
                </li>`
            )
            .join('')}
            </ul>
            <hr style="border:none; border-top:1px solid #444; margin:24px 0;" />
            <p>Recibirás más correos con el estado de tu orden.</p>
          </div>`,
          // Texto alternativo
          `Gracias por tu compra.\n\n${cleanItems
            .map(
              (p) =>
                `- Producto: ${p.product}, Cantidad: ${p.quantity}${p.size ? `, Talla: ${p.size}` : ''
                }`
            )
            .join('\n')}\n`
        );
      } catch (e) {
        console.warn('⚠️ Error enviando email:', e.message);
      }

      // 📦 Actualizar stock (solo una vez; está después de crear la orden)
      for (const item of cleanItems) {
        try {
          const dbProduct = await Product.findById(item.product);
          if (!dbProduct) {
            console.warn(`⚠️ Producto no encontrado en MongoDB: ${item.product}`);
            continue;
          }

          if (dbProduct.hasSizes && item.size) {
            if (dbProduct.sizes[item.size] !== undefined) {
              dbProduct.sizes[item.size] = Math.max(
                Number(dbProduct.sizes[item.size] || 0) - Number(item.quantity || 0),
                0
              );
              console.log(`🧵 Talla actualizada: ${dbProduct.name} - ${item.size} = ${dbProduct.sizes[item.size]}`);
            }
          } else {
            dbProduct.stock = Math.max(Number(dbProduct.stock || 0) - Number(item.quantity || 0), 0);
            console.log(`📉 Stock general actualizado: ${dbProduct.name} = ${dbProduct.stock}`);
          }

          await dbProduct.save();
        } catch (e) {
          console.warn('⚠️ Error actualizando stock:', e.message);
        }
      }
    }

    // ✅ Maneja métodos asíncronos y expiración
    if (event.type === 'checkout.session.async_payment_succeeded') {
      const s = event.data.object;
      await Order.findOneAndUpdate({ stripeSessionId: s.id }, { $set: { status: 'Paid' } });
    }

    if (event.type === 'checkout.session.async_payment_failed') {
      const s = event.data.object;
      await Order.findOneAndUpdate({ stripeSessionId: s.id }, { $set: { status: 'Failed' } });
    }

    if (event.type === 'checkout.session.expired') {
      const s = event.data.object;
      await Order.findOneAndUpdate({ stripeSessionId: s.id }, { $set: { status: 'Expired' } });
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('❌ Error interno en webhook:', err);
    return res.status(500).send('Webhook handler error');
  }
});

export default router;
