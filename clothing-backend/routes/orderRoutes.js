import express from 'express';
import Order from '../models/Order.js';

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
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(order);
    } catch (err) {
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
