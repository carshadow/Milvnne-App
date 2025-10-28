// src/pages/CartPage.jsx
import React, { useMemo, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { CartContext } from "../context/CartContext";

export default function CartPage() {
    const {
        cartItems,            // [{ _id, name, coverImage, price, originalPrice, discount, size, quantity, stock }]
        updateQty,            // (productId, size, newQty)
        removeFromCart,       // (productId, size)
        clearCart,            // () => void
    } = useContext(CartContext);

    const navigate = useNavigate();

    // Helpers de precio
    const linePrice = (item) => Number(item.price || 0); // asume price ya aplicado (descuento)
    const lineSubtotal = (item) => Number((linePrice(item) * item.quantity).toFixed(2));

    const subtotal = useMemo(
        () => Number(cartItems.reduce((sum, it) => sum + lineSubtotal(it), 0).toFixed(2)),
        [cartItems]
    );

    // Si manejas cupones/discount global, cámbialo aquí:
    const discount = 0;

    // Tu fee de plataforma (10%)
    const platformFee = useMemo(
        () => Number((subtotal * 0.10).toFixed(2)),
        [subtotal]
    );

    // Estimación de shipping/taxes (placeholder)
    const shipping = 0; // podrías calcular por peso/ubicación
    const taxes = 0;    // o calcular en backend por dirección

    const total = useMemo(
        () => Number((subtotal - discount + shipping + taxes).toFixed(2)),
        [subtotal, discount, shipping, taxes]
    );

    const handleUpdateQty = (item, next) => {
        const max = Number(item.stock ?? 99);
        const q = Math.max(1, Math.min(next, max));
        if (q !== next) {
            toast.info(`Adjusted to available stock (max ${max})`);
        }
        updateQty(item._id, item.size ?? "general", q);
    };

    const handleRemove = (item) => {
        removeFromCart(item._id, item.size ?? "general");
        toast.success("Removed from bag");
    };

    const goCheckout = () => {
        if (cartItems.length === 0) {
            toast.warning("Your bag is empty");
            return;
        }
        // Navega a tu ruta de checkout:
        navigate("/checkout");
    };

    return (
        <div className="min-h-screen bg-black text-white pt-24">
            <div className="max-w-6xl mx-auto px-4 md:px-6">
                {/* Breadcrumb / header */}
                <div className="mb-6 flex items-center justify-between">
                    <Link to="/" className="text-sm text-fuchsia-400 hover:underline">← Continue shopping</Link>
                    {cartItems.length > 0 && (
                        <button
                            onClick={() => { clearCart(); toast.info("Bag cleared"); }}
                            className="text-sm text-zinc-400 hover:text-white"
                        >
                            Clear bag
                        </button>
                    )}
                </div>

                {/* Empty state */}
                {cartItems.length === 0 ? (
                    <EmptyCart />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
                        {/* LEFT: Items */}
                        <div className="lg:col-span-2 space-y-4">
                            <h1 className="text-2xl md:text-3xl font-extrabold">Your bag</h1>
                            <p className="text-sm text-gray-400">{cartItems.length} item(s)</p>

                            <div className="mt-2 divide-y divide-zinc-800 border border-zinc-800 rounded-2xl overflow-hidden">
                                <AnimatePresence initial={false}>
                                    {cartItems.map((item) => (
                                        <motion.div
                                            key={`${item._id}-${item.size ?? "general"}`}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.15 }}
                                            className="p-4 md:p-5 bg-zinc-900/40"
                                        >
                                            <div className="flex gap-4">
                                                {/* Thumb */}
                                                <Link
                                                    to={`/product/${item._id}`}
                                                    className="flex-none h-24 w-24 md:h-28 md:w-28 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800"
                                                    title={item.name}
                                                >
                                                    <img
                                                        src={item.coverImage}
                                                        alt={item.name}
                                                        className="h-full w-full object-cover"
                                                        loading="lazy"
                                                    />
                                                </Link>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <Link
                                                                to={`/product/${item._id}`}
                                                                className="font-semibold hover:underline line-clamp-1"
                                                                title={item.name}
                                                            >
                                                                {item.name}
                                                            </Link>
                                                            <div className="mt-1 text-sm text-gray-400 flex items-center gap-3">
                                                                {item.size && <span>Size: <span className="text-gray-200">{item.size}</span></span>}
                                                                {typeof item.stock === "number" && (
                                                                    <span className={`${item.stock <= 3 ? "text-amber-400" : "text-gray-400"}`}>
                                                                        {item.stock > 0 ? (item.stock <= 3 ? `Only ${item.stock} left` : "In stock") : "Sold out"}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Price (unit) */}
                                                        <div className="text-right">
                                                            {item.discount > 0 && item.originalPrice ? (
                                                                <div className="flex flex-col items-end">
                                                                    <span className="font-bold text-white">${linePrice(item).toFixed(2)}</span>
                                                                    <span className="text-xs text-gray-400 line-through">
                                                                        ${Number(item.originalPrice).toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="font-bold text-white">${linePrice(item).toFixed(2)}</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Quantity + Remove + Line total */}
                                                    <div className="mt-3 flex items-center justify-between gap-3">
                                                        {/* Qty stepper */}
                                                        <div className="inline-flex items-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
                                                            <button
                                                                onClick={() => handleUpdateQty(item, item.quantity - 1)}
                                                                className="px-3 py-2 hover:bg-zinc-700"
                                                                aria-label="Decrease quantity"
                                                            >–</button>
                                                            <input
                                                                className="w-12 text-center bg-transparent outline-none"
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => {
                                                                    const val = Number(e.target.value || 1);
                                                                    handleUpdateQty(item, val);
                                                                }}
                                                            />
                                                            <button
                                                                onClick={() => handleUpdateQty(item, item.quantity + 1)}
                                                                className="px-3 py-2 hover:bg-zinc-700"
                                                                aria-label="Increase quantity"
                                                            >+</button>
                                                        </div>

                                                        {/* Remove */}
                                                        <button
                                                            onClick={() => handleRemove(item)}
                                                            className="text-sm text-zinc-400 hover:text-white"
                                                        >
                                                            Remove
                                                        </button>

                                                        {/* Line total */}
                                                        <div className="text-right font-semibold">
                                                            ${lineSubtotal(item).toFixed(2)}
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
                                    <h2 className="text-lg font-bold">Order Summary</h2>

                                    {/* Coupon (opcional) */}
                                    <div className="mt-4 flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Promo code"
                                            className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 outline-none"
                                        />
                                        <button
                                            onClick={() => toast.info("Coupon handling TBD")}
                                            className="px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 hover:bg-zinc-700"
                                        >
                                            Apply
                                        </button>
                                    </div>

                                    <dl className="mt-4 space-y-2 text-sm">
                                        <Row label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
                                        {discount > 0 && <Row label="Discount" value={`– $${discount.toFixed(2)}`} />}
                                        <Row label="Shipping" value={shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`} />
                                        <Row label="Taxes (est.)" value={`$${taxes.toFixed(2)}`} />
                                        <div className="border-t border-zinc-800 my-3" />
                                        <Row big label="Total" value={`$${total.toFixed(2)}`} />

                                        {/* Línea informativa de tu fee */}
                                        <div className="pt-2">
                                            <p className="text-xs text-zinc-400">
                                                Platform Fee (10%): <span className="text-gray-200">${platformFee.toFixed(2)}</span>
                                            </p>
                                            {/* Si quieres ocultarlo al cliente, muéstralo solo en el email del admin / dashboard */}
                                        </div>
                                    </dl>

                                    <motion.button
                                        whileTap={{ scale: 0.98 }}
                                        onClick={goCheckout}
                                        className="mt-4 w-full px-5 py-3 rounded-xl font-semibold bg-fuchsia-600 hover:bg-fuchsia-700"
                                    >
                                        Proceed to Checkout
                                    </motion.button>

                                    <p className="text-xs text-gray-400 mt-3">
                                        Secure payments with Stripe. Free returns within 30 days.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky mobile bar */}
            {cartItems.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 lg:hidden backdrop-blur bg-black/70 border-t border-zinc-800 px-4 py-3 flex items-center justify-between">
                    <div className="text-sm">
                        <span className="text-gray-300">Total</span>{" "}
                        <span className="font-bold">${total.toFixed(2)}</span>
                    </div>
                    <button
                        onClick={goCheckout}
                        className="px-5 py-2 rounded-xl font-semibold bg-fuchsia-600"
                    >
                        Checkout
                    </button>
                </div>
            )}
        </div>
    );
}

// Row helper
function Row({ label, value, big }) {
    return (
        <div className={`flex items-center justify-between ${big ? "text-base font-bold" : ""}`}>
            <dt className="text-gray-300">{label}</dt>
            <dd>{value}</dd>
        </div>
    );
}

// Empty state
function EmptyCart() {
    return (
        <div className="text-center py-24">
            <div className="mx-auto h-24 w-24 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                🛍️
            </div>
            <h1 className="mt-6 text-2xl md:text-3xl font-extrabold">Your bag is empty</h1>
            <p className="mt-2 text-gray-400">Explore our latest drops and best-sellers.</p>
            <Link
                to="/"
                className="inline-block mt-6 px-5 py-3 rounded-xl font-semibold bg-fuchsia-600 hover:bg-fuchsia-700"
            >
                Start shopping
            </Link>
        </div>
    );
}
