// cartRoutes.js
import express from 'express';
import Cart from '../models/Cart.js';
import { authenticateUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

// GET: obtener carrito del usuario autenticado
router.get('/', authenticateUser, async (req, res) => {
    try {
        const cartItems = await Cart.find({ user: req.user._id }).populate('product');
        res.json(cartItems);
    } catch (error) {
        console.error("❌ Error fetching cart:", error);
        res.status(500).json({ message: 'Failed to fetch cart' });
    }
});

// 🔥 DELETE: limpiar carrito del usuario autenticado (DEBE ir antes que '/:cartItemId')
router.delete('/clear', authenticateUser, async (req, res) => {
    try {
        await Cart.deleteMany({ user: req.user._id });
        return res.json({ message: "Carrito vaciado" });
    } catch (e) {
        console.error("❌ Error clearing cart:", e);
        return res.status(500).json({ message: "Failed to clear cart" });
    }
});

// POST: añadir producto (permite invitados -> userId puede ser null)
router.post('/', async (req, res) => {
    try {
        const { productId, quantity, size } = req.body;
        const userId = req.user ? req.user._id : null; // si usas authenticateUser aquí, req.user existirá

        const cartItem = new Cart({
            product: productId,
            quantity,
            size,
            user: userId, // null si invitado
        });

        await cartItem.save();

        const populatedCartItem = await Cart.findById(cartItem._id).populate('product');
        res.status(201).json({ message: 'Product added to cart', cartItem: populatedCartItem });
    } catch (error) {
        console.error("❌ Error adding product to cart:", error);
        res.status(500).json({ message: 'Error adding product to cart' });
    }
});

// DELETE: eliminar item concreto
router.delete('/:cartItemId', async (req, res) => {
    try {
        const cartItemId = req.params.cartItemId;

        // si hay usuario, valida que le pertenece
        if (req.user) {
            const deletedItem = await Cart.findOneAndDelete({ _id: cartItemId, user: req.user._id });
            if (!deletedItem) {
                return res.status(404).json({ message: "Item not found or unauthorized" });
            }
        } else {
            // si no hay user, elimina por _id a secas (solo si quieres permitirlo para invitados)
            const deletedItem = await Cart.findOneAndDelete({ _id: cartItemId });
            if (!deletedItem) {
                return res.status(404).json({ message: "Item not found" });
            }
        }

        res.json({ message: "Item removed successfully" });
    } catch (error) {
        console.error("❌ Error removing item:", error);
        res.status(500).json({ message: "Failed to remove item" });
    }
});

export default router;
