import express from 'express';
import Order from '../models/Order.js';
import { sendOrderEmail } from "../utils/mailer.js";
import { authenticateUser, verifyAdmin } from "../middlewares/authMiddleware.js";

import { z } from "zod";



const checkoutSchema = z.object({
    items: z.array(
        z.object({
            product: z.string(),
            quantity: z.number(),
            size: z.string().optional()
        })
    ),
    totalAmount: z.number(),
    address: z.string(),
    userId: z.string().nullable().optional()
});

const updateStatusSchema = z.object({
    status: z.string().min(1, "El estado es requerido")
});

const router = express.Router();

// Ruta de Checkout (anónima o autenticada)
router.post('/checkout', async (req, res) => {
    try {
        const validation = checkoutSchema.safeParse(req.body);

        if (!validation.success) {
            console.error("❌ Error de validación:", validation.error.errors);
            return res.status(400).json({
                success: false,
                errors: validation.error.errors.map(err => ({
                    path: err.path,
                    message: err.message
                })),
            });
        }

        const { items, totalAmount, address, userId } = validation.data;

        const order = new Order({
            products: items,
            total: totalAmount,
            address,
            user: userId || null,
            email: req.body.email || "",     // 👈 guarda el email
            name: req.body.name || "",
        });

        await order.save();
        res.status(201).json({ message: "Order placed successfully", order });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});


router.get('/user/:userId', authenticateUser, async (req, res) => {
    try {
        const userId = req.params.userId;
        const orders = await Order.find({ user: userId }).sort({ createdAt: -1 }).populate('products.product');
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: "Error fetching user orders" });
    }
});

// Obtener todas las órdenes (solo para admin)
router.get("/", authenticateUser, verifyAdmin, async (req, res) => {
    try {
        const { email, userId, sessionId } = req.query;
        const q = {};
        if (email) q.email = email;
        if (userId) q.user = userId;
        if (sessionId) q.stripeSessionId = sessionId;

        const orders = await Order.find(q)
            .populate("products.product")
            .populate("user")
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener órdenes", error: err.message });
    }
});
router.get("/mine", authenticateUser, async (req, res) => {
    try {
        const userId = req.user.userId;         // tu middleware pone userId
        const emailRaw = req.user.email || "";
        const emailNorm = emailRaw.trim().toLowerCase();

        console.log("🧭 /mine userId:", userId, " email:", emailRaw);

        // 1) Buscar por userId (si compró logueado)
        let orders = await Order.find({ user: userId })
            .sort({ createdAt: -1 })
            .populate("products.product")
            .lean();

        console.log("🔎 /mine por userId ->", orders.length);

        // 2) Fallback por email (guest checkout, o userId nulo)
        if (orders.length === 0 && emailNorm) {
            orders = await Order.find({
                email: { $regex: `^${emailNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: "i" }
            })
                .sort({ createdAt: -1 })
                .populate("products.product")
                .lean();

            console.log("🔎 /mine por email (norm) ->", orders.length);
        }

        res.json(orders);
    } catch (e) {
        console.error("❌ /mine error:", e);
        res.status(500).json({ message: "Error fetching my orders" });
    }
});

router.post("/claim", authenticateUser, async (req, res) => {
    try {
        const userId = req.user.userId;
        const emailRaw = req.user.email || "";
        const emailNorm = emailRaw.trim().toLowerCase();
        if (!emailNorm) return res.status(400).json({ message: "No email on user" });

        console.log("🧷 /claim userId:", userId, " email:", emailRaw);

        const result = await Order.updateMany(
            {
                user: null,
                email: { $regex: `^${emailNorm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: "i" }
            },
            { $set: { user: userId } }
        );

        const matched = result.matchedCount ?? result.nMatched ?? 0;
        const modified = result.modifiedCount ?? result.nModified ?? 0;

        console.log("🧷 /claim matched:", matched, " linked:", modified);
        res.json({ matched, linked: modified });
    } catch (e) {
        console.error("❌ /claim error:", e);
        res.status(500).json({ message: "Error claiming guest orders" });
    }
});

router.get('/user/:userId', async (req, res) => {
    try {
        const orders = await Order.find({ user: req.params.userId }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Actualizar estado de la orden
router.put("/:id/status", async (req, res) => {
    try {
        const validation = updateStatusSchema.safeParse(req.body);

        if (!validation.success) {
            console.error("❌ Error de validación:", validation.error.errors);
            return res.status(400).json({
                success: false,
                errors: validation.error.errors.map(err => ({
                    path: err.path,
                    message: err.message
                })),
            });
        }

        const { status } = validation.data;

        await Order.findByIdAndUpdate(req.params.id, { status });

        const updatedOrder = await Order.findById(req.params.id).populate("products.product");

        // 🧠 Debug
        console.log("✅ Orden para enviar email:", updatedOrder);

        // 📧 Enviar email si hay correo
        if (updatedOrder?.email) {
            const orderDetailsHtml = updatedOrder.products.map((item) => {
                const product = item.product;
                return `
                  <div style="margin-bottom: 16px; display: flex; gap: 12px; align-items: center;">
                    <img src="${product.coverImage}" alt="${product.name}" style="width: 70px; height: 70px; border-radius: 8px; object-fit: cover;" />
                    <div>
                      <p style="margin: 0; font-size: 14px;"><strong>${product.name}</strong></p>
                      <p style="margin: 0; font-size: 13px;">Cantidad: ${item.quantity}${item.size ? ` | Talla: ${item.size}` : ""}</p>
                    </div>
                  </div>
                `;
            }).join("");


            await sendOrderEmail(
                updatedOrder.email,
                `🛍 Tu orden esta en ${updatedOrder.status}`,
                `
                  <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; background-color: #111827; color: #ffffff; padding: 24px; border-radius: 12px;">
                    <h2 style="color: #f300b4; text-align: center;">🛍 Actualización de tu orden</h2>
                    <p>Hola <strong>${updatedOrder.name || "cliente"}</strong>,</p>
                    <p>Queremos informarte que el estado de tu orden ha cambiado a:</p>
                    <p style="font-size: 18px; color: #f300b4; font-weight: bold; margin: 16px 0;">${updatedOrder.status}</p>
              
                    <hr style="border: none; border-top: 1px solid #444; margin: 24px 0;" />
              
                    <h3 style="color: #f300b4; margin-bottom: 12px;">📦 Detalles de tu orden:</h3>
                    ${orderDetailsHtml}
              
                    <hr style="border: none; border-top: 1px solid #444; margin: 24px 0;" />
              
                    <p style="margin-top: 24px;">Si tienes alguna pregunta o necesitas asistencia, no dudes en responder a este correo.</p>
                    <p style="margin-top: 12px;">Gracias por confiar en <strong style="color: #f300b4;">MILVNNE Studios</strong> 💖</p>
              
                    <div style="margin-top: 32px; font-size: 12px; color: #aaaaaa; text-align: center;">
                      Este mensaje fue enviado automáticamente. No respondas directamente a este correo.
                    </div>
                  </div>
                `
            );

        }

        res.json(updatedOrder);
    } catch (err) {
        console.error("❌ Error al actualizar estado:", err);
        res.status(500).json({ message: "Error al actualizar estado", error: err.message });
    }
});



// ❌ Eliminar orden por ID
router.delete('/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Orden no encontrada" });

        await order.deleteOne();
        res.status(200).json({ message: "Orden eliminada exitosamente" });
    } catch (error) {
        console.error("❌ Error al eliminar la orden:", error);
        res.status(500).json({ message: "Error del servidor al eliminar la orden" });
    }
});


// Archivar orden (sin eliminarla de la base de datos)
router.put('/:id/archive', async (req, res) => {
    try {
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { archived: true },
            { new: true }
        );
        if (!order) {
            return res.status(404).json({ message: "Orden no encontrada" });
        }
        res.status(200).json({ message: "Orden archivada correctamente", order });
    } catch (error) {
        console.error("Error al archivar la orden:", error);
        res.status(500).json({ message: "Error del servidor al archivar la orden" });
    }
});

// Obtener solo órdenes archivadas
router.get("/archived", async (req, res) => {
    try {
        const orders = await Order.find({ archived: true })
            .populate("products.product")
            .populate("user")
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener órdenes archivadas", error: err.message });
    }
});

export default router;
