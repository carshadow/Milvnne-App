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

export default router;
