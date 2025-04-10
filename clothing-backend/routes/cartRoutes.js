// cartRoutes.js
import express from 'express';
import Cart from '../models/Cart.js'; // Use Cart model
import { authenticateUser } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Route to get all products in the cart
router.get('/', authenticateUser, async (req, res) => {
    try {
        const cartItems = await Cart.find({ user: req.user._id }).populate('product');
        res.json(cartItems);
    } catch (error) {
        console.error("❌ Error fetching cart:", error);
        res.status(500).json({ message: 'Failed to fetch cart' });
    }
});

// Route to add a product to the cart
router.post('/', async (req, res) => {  // Ensure this is the correct route
    try {
        const { productId, quantity, size } = req.body;
        const userId = req.user ? req.user._id : null;  // If user is logged in, use their ID, otherwise null

        const cartItem = new Cart({
            product: productId,
            quantity,
            size,
            user: userId,  // Can be null if user is not logged in
        });

        await cartItem.save();

        // Fetch full product details and send back the cart item along with product details
        const populatedCartItem = await Cart.findById(cartItem._id).populate('product');

        res.status(201).json({ message: 'Product added to cart', cartItem: populatedCartItem });
    } catch (error) {
        res.status(500).json({ message: 'Error adding product to cart', error });
    }
});




// DELETE route to remove an item from the cart
// DELETE route para eliminar del carrito
router.delete('/:cartItemId', async (req, res) => {
    try {
        const cartItemId = req.params.cartItemId;

        // Si el usuario está autenticado, eliminarlo de la base de datos
        if (req.user) {
            const deletedItem = await Cart.findOneAndDelete({ _id: cartItemId, user: req.user._id });
            if (!deletedItem) {
                return res.status(404).json({ message: "Item not found or unauthorized" });
            }
        }

        res.json({ message: "Item removed successfully" });
    } catch (error) {
        console.error("❌ Error removing item:", error);
        res.status(500).json({ message: "Failed to remove item" });
    }
});



export default router;
