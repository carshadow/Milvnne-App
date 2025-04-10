import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,  // Puede ser null si el usuario no está logueado
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
    },
    size: {
        type: String,
        required: true,
    },
});

const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
