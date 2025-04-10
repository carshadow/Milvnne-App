const Product = require('../models/product');

// Función para manejar la compra y la actualización del stock
exports.buyProduct = async (req, res) => {
    const { productId, size, quantity } = req.body;

    try {
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        if (product.hasSizes) {
            // 🧵 Producto con tallas
            if (!size || product.sizes[size] === undefined) {
                return res.status(400).json({ message: 'Talla no válida' });
            }

            if (product.sizes[size] < quantity) {
                return res.status(400).json({ message: 'No hay suficiente stock para esta talla' });
            }

            product.sizes[size] -= quantity;

            if (product.sizes[size] === 0) {
                product.isSoldOut = true;
            }
        } else {
            // 📦 Producto sin tallas
            if (product.stock < quantity) {
                return res.status(400).json({ message: 'No hay suficiente stock disponible' });
            }

            product.stock -= quantity;

            if (product.stock === 0) {
                product.isSoldOut = true;
            }
        }

        await product.save();
        res.status(200).json({ message: 'Compra realizada con éxito' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al procesar la compra' });
    }
    // controllers/productController.js
    const Product = require('../models/product');

    exports.updateProduct = async (req, res) => {
        try {
            const product = await Product.findById(req.params.id);

            if (!product) return res.status(404).json({ message: "Producto no encontrado" });

            product.name = req.body.name || product.name;
            product.description = req.body.description || product.description;
            product.price = req.body.price || product.price;
            product.originalPrice = req.body.originalPrice || product.originalPrice;
            product.discount = req.body.discount || 0;
            product.sizes = req.body.sizes || product.sizes;

            await product.save();
            res.status(200).json({ message: "Producto actualizado correctamente", product });

        } catch (error) {
            console.error("Error actualizando producto:", error);
            res.status(500).json({ message: "Error del servidor al actualizar producto" });
        }
    };


};
