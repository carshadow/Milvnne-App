import React, { useContext, useState } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/authContext'; // ✅ Importado
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from "@stripe/stripe-js";
import { motion } from 'framer-motion';

const stripePromise = loadStripe("pk_test_51QSkyUB3NdXOFdwIiRiSTs7BfhfFE1PoNYyz4UaFKmjPiVNd9kkwHxIs75odcmFNC8IbUICv3mJUoF9byI8Kul94005kmqRFii");

const CartPage = () => {
    const { cart, removeFromCart, updateQuantity } = useContext(CartContext);
    const { user } = useContext(AuthContext); // ✅ Usado aquí
    const [suggestedProducts, setSuggestedProducts] = useState([]);
    const navigate = useNavigate();

    const handleRemove = (cartItemId) => {
        removeFromCart(cartItemId);
    };

    // const handleCheckout = async () => {
    //     const stripe = await stripePromise;
    //     try {
    //         // ✅ Aquí se añade el userId
    //         const cartItems = cart.map(item => ({
    //             product: item.product,
    //             quantity: item.quantity,
    //             size: item.size,
    //             userId: user?._id || "guest"
    //         }));

    //         const response = await fetch("http://localhost:8080/api/stripe/create-checkout-session", {
    //             method: "POST",
    //             headers: { "Content-Type": "application/json" },
    //             body: JSON.stringify({ cartItems }),
    //         });

    //         const session = await response.json();
    //         if (session.id) {
    //             localStorage.setItem("checkoutInProgress", "true");
    //             stripe.redirectToCheckout({ sessionId: session.id });
    //         } else {
    //             alert(`❌ Error: ${session.message || "No session ID returned"}`);
    //         }
    //     } catch (error) {
    //         console.error("❌ Error en checkout:", error);
    //         alert("❌ Error processing payment");
    //     }
    // };

    const handleCheckout = async () => {
        const stripe = await stripePromise;
        try {
            // ✅ Aquí se añade el userId y solo el ID del producto
            const cartItems = cart.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                size: item.size,
                userId: user?._id || "guest",
                name: item.product.name,
                price: item.product.price,
                image: item.product.coverImage
            }));

            const response = await fetch("http://localhost:8080/api/stripe/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cartItems }),
            });

            const session = await response.json();
            if (session.id) {
                localStorage.setItem("checkoutInProgress", "true");
                stripe.redirectToCheckout({ sessionId: session.id });
            } else {
                alert(`❌ Error: ${session.message || "No session ID returned"}`);
            }
        } catch (error) {
            console.error("❌ Error en checkout:", error);
            alert("❌ Error processing payment");
        }
    };


    const total = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

    return (
        <div className="pt-28 px-6 pb-24 min-h-screen bg-[#111827] text-white">
            <h1 className="text-4xl font-extrabold text-fuchsia-400 text-center mb-12 uppercase tracking-wide">
                Tu Carrito
            </h1>

            {cart.length === 0 ? (
                <div className="text-center text-lg text-gray-400">
                    <p>Tu carrito está vacío.</p>
                    <Link
                        to="/"
                        className="mt-4 inline-block text-fuchsia-400 hover:underline transition duration-300"
                    >
                        Volver a comprar
                    </Link>
                </div>
            ) : (
                <div className="max-w-5xl mx-auto flex flex-col lg:flex-row gap-10">
                    {/* Cart Items */}
                    <div className="flex-1 space-y-8">
                        {cart.map((item) => (
                            <motion.div
                                key={item._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                                className="flex flex-col md:flex-row md:items-center justify-between bg-zinc-800 rounded-xl p-6 shadow-lg hover:shadow-fuchsia-700/20 transition-all"
                            >
                                <div className="flex items-center space-x-6">
                                    <img
                                        src={`http://localhost:8080${item.product.coverImage}`}
                                        alt={item.product.name}
                                        className="w-28 h-28 object-cover rounded-lg border-2 border-fuchsia-500"
                                    />
                                    <div>
                                        <h2 className="text-xl font-semibold text-white mb-1">{item.product.name}</h2>
                                        <p className="text-sm text-gray-400">Talla: {item.size}</p>
                                        <div className="flex items-center mt-2 space-x-2">
                                            <button
                                                onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                                disabled={item.quantity === 1}
                                                className="px-2 py-1 bg-zinc-700 rounded hover:bg-zinc-600"
                                            >-</button>
                                            <span className="text-lg">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                                className="px-2 py-1 bg-zinc-700 rounded hover:bg-zinc-600"
                                            >+</button>
                                        </div>
                                        <p className="text-lg text-fuchsia-400 font-bold mt-2">
                                            ${(item.product.price * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handleRemove(item._id)}
                                    className="mt-4 md:mt-0 text-red-400 hover:text-red-500 font-semibold"
                                >
                                    Eliminar
                                </button>
                            </motion.div>
                        ))}
                    </div>

                    {/* Summary */}
                    <div className="w-full lg:w-[320px] bg-zinc-800 p-6 rounded-xl shadow-lg h-fit">
                        <h3 className="text-2xl font-bold text-white mb-4">Resumen</h3>
                        <div className="space-y-3 text-gray-300 text-sm">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                            <hr className="border-gray-600 my-4" />
                            <div className="flex justify-between font-bold text-white text-lg">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            className="mt-6 w-full px-6 py-3 bg-fuchsia-500 text-white rounded-full font-semibold hover:bg-fuchsia-600 transition-all"
                        >
                            Proceder al Pago
                        </button>
                    </div>
                </div>
            )}

            {/* Productos sugeridos (opcional si lo estás usando) */}
            <div className="mt-20 max-w-6xl mx-auto">
                <h3 className="text-3xl font-bold text-fuchsia-400 mb-6">
                    Quizás también te guste
                </h3>
                <div className="flex gap-6 overflow-x-auto pb-2">
                    {suggestedProducts.map((product) => (
                        <motion.div
                            key={product._id}
                            className="min-w-[220px] bg-zinc-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl cursor-pointer transition-all"
                            whileHover={{ scale: 1.05 }}
                            onClick={() => navigate(`/product/${product._id}`)}
                        >
                            <img
                                src={`http://localhost:8080${product.coverImage}`}
                                alt={product.name}
                                className="w-full h-40 object-cover"
                            />
                            <div className="p-4">
                                <h4 className="text-white font-semibold text-lg">{product.name}</h4>
                                <p className="text-fuchsia-400 font-bold">${product.price}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CartPage;
