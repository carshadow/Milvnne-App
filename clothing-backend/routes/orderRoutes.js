import express from 'express';
import Order from '../models/Order.js';
import { sendOrderEmail } from "../utils/mailer.js";


const router = express.Router();

// Ruta de Checkout (anónima o autenticada)
router.post('/checkout', async (req, res) => {
    try {
        const { items, totalAmount, address, userId } = req.body;

        // Si el usuario está logueado, se utiliza su ID; si no, se deja null
        const order = new Order({
            products: items,
            total: totalAmount,
            address,
            user: userId || null,  // Permite orden sin usuario logueado
        });

        await order.save();
        res.status(201).json({ message: "Order placed successfully", order });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

router.get('/user/:userId', async (req, res) => {
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
router.get("/", async (req, res) => {
    try {
        const orders = await Order.find().populate("products.product").populate("user").sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener órdenes", error: err.message });
    }
});

// Actualizar estado de la orden
router.put("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;

        // ⚠️ Actualizamos primero
        await Order.findByIdAndUpdate(req.params.id, { status });

        // ✅ Luego buscamos con populate completo
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
                `🛍 Tu orden ha sido actualizada - Estado: ${updatedOrder.status}`,
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
                    <p style="margin-top: 12px;">Gracias por confiar en <strong>MILVNNE Studios</strong> 💖</p>

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
