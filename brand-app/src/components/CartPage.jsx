import React, { useContext, useState, useEffect, useMemo } from 'react';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/authContext';
import { Link, useNavigate } from 'react-router-dom';
import { loadStripe } from "@stripe/stripe-js";
import { motion, AnimatePresence } from 'framer-motion';
import { FaShoppingBag } from 'react-icons/fa';
import { toast } from 'react-toastify';

const stripePromise = loadStripe("pk_live_51QSkyUB3NdXOFdwI4wiO965mtk6IHRXt5Dga4t3ahaGAaMyDLTAkaWvRFpJmRZt85H935tr0SaVOJa6pbAi7xlgp00d0zlJdIg");

// === Fee helper ===
// Si quieres 10%, cambia 0.05 -> 0.10 y quita el +0.30 si no aplica
const calcStripeFee = (subtotal) => {
    if (subtotal <= 0) return 0;
    const fee = subtotal * 0.05 + 0.30;
    const minFee = Math.max(fee, 0.50);
    return Number(minFee.toFixed(2));
};

// === Util ===
const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

const CartPage = () => {
    const { cart: rawCart, removeFromCart, updateQuantity } = useContext(CartContext) || {};
    const { user } = useContext(AuthContext) || {};
    const navigate = useNavigate();

    const cart = Array.isArray(rawCart) ? rawCart : [];
    const uid = user?._id || user?.userId || "guest";

    const [suggestedProducts, setSuggestedProducts] = useState([]);
    const [orders, setOrders] = useState([]);

    // ===== Fetches =====
    useEffect(() => {
        fetchSuggestedProducts();
        if (user && user._id) fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?._id]);

    const fetchOrders = async () => {
        try {
            const res = await fetch(`https://clothing-backend.fly.dev/api/orders/user/${user._id}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
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
            setSuggestedProducts(Array.isArray(data) ? data.slice(0, 8) : []);
        } catch (error) {
            console.error('Error fetching suggested products:', error);
        }
    };

    // ===== Derivados =====
    const lineSubtotal = (item) => {
        const p = Number(item?.product?.price || 0);
        const q = Number(item?.quantity || 0);
        return Number((p * q).toFixed(2));
    };

    const subtotal = useMemo(
        () => Number(cart.reduce((acc, it) => acc + lineSubtotal(it), 0).toFixed(2)),
        [cart]
    );

    const stripeFee = calcStripeFee(subtotal);
    const totalWithFee = Number((subtotal + stripeFee).toFixed(2));

    // ===== Handlers =====
    const handleRemove = (cartItemId) => {
        removeFromCart?.(cartItemId);
        toast.success("Producto eliminado del carrito");
    };

    const handleStepQuantity = (item, next) => {
        const max = item?.product?.hasSizes
            ? Number(item?.product?.sizes?.[item?.size] ?? 0)
            : Number(item?.product?.stock ?? 0);

        const clamped = Math.max(1, Math.min(next, max || next));
        if (max && next > max) toast.info(`Cantidad ajustada. Máximo disponible: ${max}`);
        updateQuantity?.(item._id, clamped);
    };

    const handleCheckout = async () => {
        const stripe = await stripePromise;
        try {
            const cartItems = [
                ...cart.map(item => ({
                    product: item.product._id,
                    quantity: item.quantity,
                    size: item.size,
                    userId: uid,
                    name: item.product.name,
                    price: Number(Number(item.product.price).toFixed(2)),
                    image: item.product.coverImage,
                    ...(user?.email ? { email: user.email } : {}),
                })),
                {
                    name: "Tarifa de servicio",
                    quantity: 1,
                    price: Number(stripeFee.toFixed(2)),
                    image: "https://brand-app.fly.dev/service-fee.png",
                    userId: uid
                }
            ];

            const response = await fetch("https://clothing-backend.fly.dev/api/stripe/create-checkout-session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cartItems, userId: uid }),
            });

            if (!response.ok) {
                let err = {};
                try { err = await response.json(); } catch { }
                console.error("❌ Stripe session error:", err);
                alert(`❌ Error creando sesión: ${err.detail || err.message || `HTTP ${response.status}`}`);
                return;
            }

            const session = await response.json();
            if (session.id) {
                localStorage.setItem("checkoutInProgress", "true");
                await stripe.redirectToCheckout({ sessionId: session.id });
            } else {
                alert(`❌ Error: ${session.message || "No session ID returned"}`);
            }
        } catch (error) {
            console.error("❌ Error en checkout:", error);
            alert("❌ Error processing payment");
        }
    };

    // ===== UI =====
    const isEmpty = cart.length === 0;

    return (
        <div className="min-h-screen bg-black text-white pt-24">
            <div className="max-w-6xl mx-auto px-4 md:px-6">
                {/* Top bar */}
                <div className="mb-6 flex items-center justify-between">
                    <Link to="/" className="text-sm text-fuchsia-400 hover:underline">← Seguir comprando</Link>
                    {!isEmpty && (
                        <button
                            onClick={() => {
                                // opción: limpiar todo con una función si la tienes
                                // clearCart?.();
                                // Como no la tienes en este archivo, puedes iterar:
                                cart.forEach(i => removeFromCart?.(i._id));
                                toast.info("Carrito vaciado");
                            }}
                            className="text-sm text-zinc-400 hover:text-white"
                        >
                            Vaciar carrito
                        </button>
                    )}
                </div>

                {isEmpty ? (
                    <EmptyState />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
                        {/* LEFT: Items */}
                        <div className="lg:col-span-2">
                            <h1 className="text-2xl md:text-3xl font-extrabold">Tu carrito</h1>
                            <p className="text-sm text-gray-400">{cart.length} artículo(s)</p>

                            <div className="mt-3 divide-y divide-zinc-800 border border-zinc-800 rounded-2xl overflow-hidden">
                                <AnimatePresence initial={false}>
                                    {cart.map((item) => (
                                        <motion.div
                                            key={item._id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.15 }}
                                            className="p-4 md:p-5 bg-zinc-900/40"
                                        >
                                            <div className="flex gap-4">
                                                {/* Thumb */}
                                                <Link
                                                    to={`/product/${item.product._id}`}
                                                    className="flex-none h-24 w-24 md:h-28 md:w-28 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800"
                                                    title={item.product.name}
                                                >
                                                    <img
                                                        src={item.product.coverImage}
                                                        alt={item.product.name}
                                                        className="h-full w-full object-cover"
                                                        loading="lazy"
                                                    />
                                                </Link>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <Link
                                                                to={`/product/${item.product._id}`}
                                                                className="font-semibold hover:underline line-clamp-1"
                                                                title={item.product.name}
                                                            >
                                                                {item.product.name}
                                                            </Link>
                                                            <div className="mt-1 text-sm text-gray-400 flex items-center gap-3">
                                                                {item.size && <span>Talla: <span className="text-gray-200">{item.size}</span></span>}
                                                                {typeof item.product.stock === "number" && (
                                                                    <span className={`${item.product.stock <= 3 ? "text-amber-400" : "text-gray-400"}`}>
                                                                        {item.product.hasSizes
                                                                            ? (item.product.sizes?.[item.size] ?? 0) <= 0
                                                                                ? "Agotado"
                                                                                : (item.product.sizes?.[item.size] ?? 0) <= 3
                                                                                    ? `Quedan ${(item.product.sizes?.[item.size] ?? 0)}`
                                                                                    : "En stock"
                                                                            : item.product.stock <= 0
                                                                                ? "Agotado"
                                                                                : item.product.stock <= 3
                                                                                    ? `Quedan ${item.product.stock}`
                                                                                    : "En stock"}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Unit price */}
                                                        <div className="text-right">
                                                            {item.product.discount > 0 && item.product.originalPrice ? (
                                                                <div className="flex flex-col items-end">
                                                                    <span className="font-bold text-white">{fmt(item.product.price)}</span>
                                                                    <span className="text-xs text-gray-400 line-through">
                                                                        {fmt(item.product.originalPrice)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="font-bold text-white">{fmt(item.product.price)}</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Qty + Remove + Line total */}
                                                    <div className="mt-3 flex items-center justify-between gap-3">
                                                        {/* Qty stepper */}
                                                        <div className="inline-flex items-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
                                                            <button
                                                                onClick={() => handleStepQuantity(item, item.quantity - 1)}
                                                                className="px-3 py-2 hover:bg-zinc-700"
                                                                aria-label="Disminuir cantidad"
                                                                disabled={item.quantity <= 1}
                                                            >–</button>
                                                            <input
                                                                className="w-12 text-center bg-transparent outline-none"
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => {
                                                                    const val = Number(e.target.value || 1);
                                                                    handleStepQuantity(item, val);
                                                                }}
                                                            />
                                                            <button
                                                                onClick={() => handleStepQuantity(item, item.quantity + 1)}
                                                                className="px-3 py-2 hover:bg-zinc-700"
                                                                aria-label="Aumentar cantidad"
                                                            >+</button>
                                                        </div>

                                                        {/* Remove */}
                                                        <button
                                                            onClick={() => handleRemove(item._id)}
                                                            className="text-sm text-zinc-400 hover:text-white"
                                                        >
                                                            Eliminar
                                                        </button>

                                                        {/* Line total */}
                                                        <div className="text-right font-semibold">
                                                            {fmt(lineSubtotal(item))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* RIGHT: Summary (sticky) */}
                        <div className="lg:sticky lg:top-24 lg:self-start">
                            <div className="rounded-2xl border border-zinc-800 overflow-hidden">
                                <div className="p-5 bg-zinc-900/40">
                                    <h2 className="text-lg font-bold">Resumen</h2>

                                    <dl className="mt-4 space-y-2 text-sm">
                                        <Row label="Subtotal" value={fmt(subtotal)} />
                                        <Row label="Tarifa por servicio" value={fmt(stripeFee)} />
                                        <div className="border-t border-zinc-800 my-3" />
                                        <Row big label="Total" value={fmt(totalWithFee)} />
                                    </dl>

                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleCheckout}
                                        className="mt-4 w-full px-5 py-3 rounded-xl font-semibold bg-fuchsia-600 hover:bg-fuchsia-700"
                                    >
                                        Proceder al pago
                                    </motion.button>

                                    <p className="text-xs text-gray-400 mt-3">
                                        Pagos seguros con Stripe. Devoluciones gratis dentro de 30 días.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Recomendados */}
                {!isEmpty && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                        className="mt-16 px-4 sm:px-0 py-10 bg-zinc-900/60 backdrop-blur rounded-2xl border border-zinc-800"
                    >
                        <h3 className="text-2xl md:text-3xl font-extrabold mb-6 text-center text-fuchsia-400 flex items-center justify-center gap-3">
                            <FaShoppingBag className="text-fuchsia-400 text-2xl" />
                            Recomendado para ti
                        </h3>

                        <div className="overflow-x-auto no-scrollbar pb-2">
                            <div className="flex gap-5 w-max">
                                {suggestedProducts.map((p) => (
                                    <motion.button
                                        key={p._id}
                                        whileHover={{ y: -2 }}
                                        onClick={() => navigate(`/product/${p._id}`)}
                                        className="relative group bg-zinc-900 border border-zinc-800 rounded-2xl w-[220px] flex-shrink-0 overflow-hidden text-left"
                                    >
                                        <div className="aspect-[3/4]">
                                            <img
                                                src={p.coverImage}
                                                alt={p.name}
                                                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                loading="lazy"
                                            />
                                        </div>
                                        <div className="p-3">
                                            <h4 className="text-sm font-semibold line-clamp-1">{p.name}</h4>
                                            <div className="mt-1">
                                                {p.discount > 0 ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-pink-400 font-bold">{fmt(p.price)}</span>
                                                        <span className="text-xs text-gray-400 line-through">{fmt(p.originalPrice)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-white font-semibold">{fmt(p.price)}</span>
                                                )}
                                            </div>
                                        </div>
                                        {p.discount > 0 && (
                                            <span className="absolute top-2 left-2 text-xs px-2 py-1 rounded-full bg-red-600 text-white">
                                                -{p.discount}%
                                            </span>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Sticky mobile footer */}
            {!isEmpty && (
                <div className="fixed bottom-0 left-0 right-0 lg:hidden backdrop-blur bg-black/70 border-t border-zinc-800 px-4 py-3 flex items-center justify-between">
                    <div className="text-sm">
                        <span className="text-gray-300">Total</span>{" "}
                        <span className="font-bold">{fmt(totalWithFee)}</span>
                    </div>
                    <button
                        onClick={handleCheckout}
                        className="px-5 py-2 rounded-xl font-semibold bg-fuchsia-600"
                    >
                        Pagar
                    </button>
                </div>
            )}
        </div>
    );
};

function Row({ label, value, big }) {
    return (
        <div className={`flex items-center justify-between ${big ? "text-base font-bold" : ""}`}>
            <dt className="text-gray-300">{label}</dt>
            <dd>{value}</dd>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="text-center py-24">
            <div className="mx-auto h-24 w-24 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                🛍️
            </div>
            <h1 className="mt-6 text-2xl md:text-3xl font-extrabold">Tu carrito está vacío</h1>
            <p className="mt-2 text-gray-400">Explora nuestros lanzamientos y best-sellers.</p>
            <Link
                to="/"
                className="inline-block mt-6 px-5 py-3 rounded-xl font-semibold bg-fuchsia-600 hover:bg-fuchsia-700"
            >
                Empezar a comprar
            </Link>
        </div>
    );
}

export default CartPage;
