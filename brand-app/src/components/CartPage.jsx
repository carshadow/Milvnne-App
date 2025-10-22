import React, { useContext, useState, useEffect } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/authContext'; //  Importado
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from "@stripe/stripe-js";
import { motion } from 'framer-motion';
import { FaShoppingBag } from 'react-icons/fa';
import { toast } from 'react-toastify';


const stripePromise = loadStripe("pk_live_51QSkyUB3NdXOFdwI4wiO965mtk6IHRXt5Dga4t3ahaGAaMyDLTAkaWvRFpJmRZt85H935tr0SaVOJa6pbAi7xlgp00d0zlJdIg");

// Helper: calcula fee (5% + 0.30) con mínimo $0.50
const calcStripeFee = (subtotal) => {
    if (subtotal <= 0) return 0;
    const fee = subtotal * 0.05 + 0.30;
    const minFee = Math.max(fee, 0.50);
    return Number(minFee.toFixed(2));
};

const CartPage = () => {
    const { cart, removeFromCart, updateQuantity } = useContext(CartContext);
    const { user } = useContext(AuthContext); //  Usado aquí
    const [suggestedProducts, setSuggestedProducts] = useState([]);
    const [orders, setOrders] = useState([]);
    const navigate = useNavigate();
    const uid = user?._id || user?.userId || "guest";


    const handleRemove = (cartItemId) => {
        removeFromCart(cartItemId);
    };

    useEffect(() => {
        fetchSuggestedProducts(); // Siempre traer sugerencias
        if (user && user._id) {
            fetchOrders(); // Solo traer órdenes si hay usuario
        }
    }, [user]);

    const fetchOrders = async () => {
        try {
            const res = await fetch(`https://clothing-backend.fly.dev/api/orders/user/${user._id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await res.json();
            setOrders(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setOrders([]);
        }
    };

    const fetchSuggestedProducts = async () => {
        try {
            const res = await fetch('https://clothing-backend.fly.dev/api/products');
            const data = await res.json();
            setSuggestedProducts(data.slice(0, 5));
        } catch (error) {
            console.error('Error fetching suggested products:', error);
        }
    };

    const handleCheckout = async () => {
        const stripe = await stripePromise;

        try {
            const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
            const stripeFee = calcStripeFee(subtotal);

            const cartItems = [
                ...cart.map(item => ({
                    product: item.product._id,
                    quantity: item.quantity,
                    size: item.size,
                    userId: uid,
                    name: item.product.name,
                    price: Number(item.product.price.toFixed(2)),
                    image: item.product.coverImage,
                    email: user?.email || "carlos.sanchez.castillo2003@gmail.com"
                })),
                {
                    name: "Tarifa de servicio",
                    quantity: 1,
                    price: Number(stripeFee.toFixed(2)),
                    image: "https://brand-app.fly.dev/service-fee.png",
                    userId: user?._id || "guest"
                }
            ];
            for (let item of cart) {
                if (item.product.hasSizes && item.size) {
                    const available = item.product.sizes[item.size];
                    if (item.quantity > available) {
                        toast.error(`🚫 Solo quedan ${available} unidad(es) disponibles para la talla ${item.size} de "${item.product.name}"`);
                        return;
                    }
                } else if (!item.product.hasSizes) {
                    if (item.quantity > item.product.stock) {
                        toast.error(`🚫 Solo quedan ${item.product.stock} unidad(es) disponibles de "${item.product.name}"`);
                        return;
                    }
                }
            }

            const response = await fetch("https://clothing-backend.fly.dev/api/stripe/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cartItems,
                    userId: uid, // 👈 Añade esto
                }),
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


    //  Cálculo del subtotal
    const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

    //  Tarifa de Stripe: 2.9% + $0.30
    const stripeFee = calcStripeFee(subtotal);

    //  Total con tarifa incluida
    const totalWithFee = subtotal + stripeFee;

    const total = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-slate-300 py-20 px-6 text-white">
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
                                        src={item.product.coverImage}
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
                                                disabled={
                                                    item.product.hasSizes
                                                        ? item.quantity >= item.product.sizes[item.size]
                                                        : item.quantity >= item.product.stock
                                                }
                                                className="px-2 py-1 bg-zinc-700 rounded hover:bg-zinc-600 disabled:opacity-50"
                                            >
                                                +
                                            </button>

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
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Tarifa por servicio</span>
                                <span>${stripeFee.toFixed(2)}</span>
                            </div>
                            <hr className="border-gray-600 my-4" />
                            <div className="flex justify-between font-bold text-white text-lg">
                                <span>Total</span>
                                <span>${totalWithFee.toFixed(2)}</span>
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
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-20 px-4 sm:px-8 py-12 bg-zinc-900/80 backdrop-blur-lg rounded-3xl shadow-2xl text-white max-w-7xl mx-auto"
            >
                <h3 className="text-3xl sm:text-4xl font-extrabold mb-10 tracking-tight text-center text-fuchsia-400 flex items-center justify-center gap-3">
                    <FaShoppingBag className="text-fuchsia-400 text-2xl" />
                    Recomendado para ti
                </h3>

                <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-fuchsia-500/40 pb-4">
                    <div className="flex gap-8 px-2 sm:px-4 w-max">
                        {suggestedProducts.map((product) => (
                            <motion.div
                                key={product._id}
                                whileHover={{ scale: 1.05 }}
                                transition={{ type: "spring", stiffness: 300 }}
                                onClick={() => navigate(`/product/${product._id}`)}
                                className="relative group bg-zinc-800 border border-zinc-700 rounded-2xl w-[240px] flex-shrink-0 cursor-pointer overflow-hidden shadow-xl hover:shadow-fuchsia-600/30 transition-all duration-300"
                            >
                                {/* Imagen */}
                                <img
                                    src={product.coverImage}
                                    alt={product.name}
                                    className="w-full h-60 object-cover group-hover:brightness-110 transition duration-500"
                                />

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />

                                {/* Badge descuento */}
                                {product.discount > 0 && (
                                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full z-30 shadow-md">
                                        -{product.discount}% OFF
                                    </div>
                                )}

                                {/* Info */}
                                <div className="absolute bottom-4 left-4 right-4 z-20 space-y-1">
                                    <h4 className="text-white font-semibold text-sm leading-tight truncate">
                                        {product.name}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                        {product.discount > 0 ? (
                                            <>
                                                <span className="text-xs line-through text-gray-400">${Number(product.originalPrice).toFixed(2)}</span>
                                                <span className="text-fuchsia-400 font-bold text-sm">${Number(product.price).toFixed(2)}</span>
                                            </>
                                        ) : (
                                            <span className="text-fuchsia-400 font-bold text-sm">${Number(product.price).toFixed(2)}</span>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>

        </div>
    );
};

export default CartPage;
