const Cart = require('../models/Cart'); // Importa el modelo de Cart

// Buscar carritos que contienen un producto específico
async function findCartWithProduct(req, res) {
    const { productId } = req.params;

    try {
        const carts = await Cart.find({ 'products.productId': productId });

        if (carts.length > 0) {
            return res.status(200).json({ message: 'Producto encontrado en los carritos', carts });
        } else {
            return res.status(404).json({ message: 'No se encontró el producto en los carritos' });
        }
    } catch (error) {
        console.error('Error buscando el producto:', error);
        return res.status(500).json({ message: 'Error del servidor' });
    }
}

// Eliminar producto de un carrito
async function removeProductFromCart(req, res) {
    const { userId, productId } = req.params;

    try {
        const result = await Cart.updateOne(
            { userId: userId },
            { $pull: { products: { productId: productId } } }
        );

        if (result.modifiedCount > 0) {
            return res.status(200).json({ message: 'Producto eliminado del carrito' });
        } else {
            return res.status(404).json({ message: 'No se encontró el producto en el carrito' });
        }
    } catch (error) {
        console.error('Error eliminando el producto:', error);
        return res.status(500).json({ message: 'Error del servidor' });
    }
}

// Vaciar todos los carritos
async function clearAllCarts(req, res) {
    try {
        const result = await Cart.updateMany({}, { $set: { products: [] } });

        if (result.modifiedCount > 0) {
            return res.status(200).json({ message: 'Todos los carritos han sido vaciados' });
        } else {
            return res.status(404).json({ message: 'No se encontraron carritos' });
        }
    } catch (error) {
        console.error('Error vaciando los carritos:', error);
        return res.status(500).json({ message: 'Error del servidor' });
    }
}

module.exports = {
    findCartWithProduct,
    removeProductFromCart,
    clearAllCarts,
};
