import React, { useEffect, useState, useContext, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

// 💬 Toast helpers
const toastAddedToCart = ({ img, name, size, qty }) => {
    toast(
        <div className="flex items-center gap-3">
            <img
                src={img}
                alt={name}
                className="h-12 w-12 rounded-md object-cover border border-zinc-800"
            />
            <div className="text-sm">
                <p className="font-semibold text-white">Added to bag</p>
                <p className="text-zinc-300">
                    {name} {size && <span className="text-zinc-400">· {size}</span>} — x{qty}
                </p>
                <Link to="/cart" className="inline-block mt-1 text-fuchsia-400 hover:underline">
                    View cart →
                </Link>
            </div>
        </div>,
        {
            position: "bottom-right",
            autoClose: 2400,
            closeOnClick: true,
            pauseOnHover: true,
            theme: "dark",
            className: "bg-zinc-900 border border-zinc-800 rounded-xl",
            progressStyle: { background: "#d946ef" },
        }
    );
};

const toastInfo = (msg) =>
    toast.info(msg, {
        position: "bottom-right",
        autoClose: 2000,
        theme: "dark",
        className: "bg-zinc-900 border border-zinc-800 rounded-xl",
        progressStyle: { background: "#a1a1aa" },
    });

const toastErr = (msg) =>
    toast.error(msg, {
        position: "bottom-right",
        autoClose: 2600,
        theme: "dark",
        className: "bg-zinc-900 border border-zinc-800 rounded-xl",
        progressStyle: { background: "#ef4444" },
    });

export default function ProductDetail() {
    const { id } = useParams();
    const { addToCart } = useContext(CartContext);

    const [product, setProduct] = useState(null);
    const [selectedImage, setSelectedImage] = useState("");
    const [selectedSize, setSelectedSize] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);
    const [sizeError, setSizeError] = useState("");

    // 🔧 Normalizador para evitar "hasSizes" como string "false"
    const normalizeProduct = (raw) => {
        const hasSizesBool =
            (typeof raw.hasSizes === "boolean"
                ? raw.hasSizes
                : raw.hasSizes === "true" || raw.hasSizes === true) &&
            raw.sizes &&
            Object.keys(raw.sizes).length > 0;

        const normalizedSizes = Object.fromEntries(
            Object.entries(raw.sizes || {}).map(([k, v]) => [k, Number(v || 0)])
        );

        return {
            ...raw,
            hasSizes: hasSizesBool,
            sizes: normalizedSizes,
            stock: Number(raw.stock || 0),
            price: Number(raw.price || 0),
            originalPrice:
                raw.originalPrice != null ? Number(raw.originalPrice) : undefined,
            discount: Number(raw.discount || 0),
        };
    };

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`https://clothing-backend.fly.dev/api/products/${id}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const normalized = normalizeProduct(data);
                setProduct(normalized);
                setSelectedImage(normalized.coverImage);
                setSelectedSize("");
                setQuantity(1);
                setSizeError("");
            } catch (e) {
                toastErr("Error loading product");
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    // 🖼️ Galería
    const images = useMemo(() => {
        if (!product) return [];
        const list = [product.coverImage, product.hoverImage, ...(product.images || [])].filter(Boolean);
        return Array.from(new Set(list));
    }, [product]);

    // ✅ Flag seguro para decidir si realmente hay tallas
    const hasSizesSafe = useMemo(() => {
        if (!product) return false;
        if (!product.hasSizes) return false;
        const keys = Object.keys(product.sizes || {});
        return keys.length > 0; // hay estructura de tallas
    }, [product]);

    // 📦 Stock actual (por talla o general)
    const currentStock = useMemo(() => {
        if (!product) return 0;
        if (hasSizesSafe) {
            return selectedSize ? Number(product.sizes?.[selectedSize] || 0) : 0;
        }
        return Number(product.stock || 0);
    }, [product, selectedSize, hasSizesSafe]);

    const lowStockLabel =
        currentStock > 0 && currentStock <= 3 ? `Only ${currentStock} left` : "";

    // 🛒 Add to cart con validaciones
    const handleAdd = () => {
        if (!product) return;

        if (hasSizesSafe && !selectedSize) {
            setSizeError("Please select a size");
            toastInfo("Select a size to continue");
            return;
        }

        if (quantity > currentStock) {
            toastErr(`Max available: ${currentStock}`);
            return;
        }

        addToCart(product._id, quantity, hasSizesSafe ? selectedSize : "general");

        toastAddedToCart({
            img: selectedImage || product.coverImage,
            name: product.name,
            size: hasSizesSafe ? selectedSize : null,
            qty: quantity,
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 px-4 md:px-6 bg-black text-white">
                <div className="max-w-6xl mx-auto animate-pulse">
                    <div className="h-6 w-40 bg-zinc-800 rounded mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="aspect-[3/4] bg-zinc-800 rounded-2xl" />
                        <div className="space-y-4">
                            <div className="h-8 w-2/3 bg-zinc-800 rounded" />
                            <div className="h-5 w-1/3 bg-zinc-800 rounded" />
                            <div className="h-10 w-48 bg-zinc-800 rounded" />
                            <div className="h-32 w-full bg-zinc-800 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return <p className="text-center text-red-400 pt-24">Product not found.</p>;
    }

    const priceBlock = (
        <div className="flex items-baseline gap-3">
            {product.discount > 0 && product.originalPrice ? (
                <>
                    <span className="text-2xl font-bold text-white">
                        ${Number(product.price).toFixed(2)}
                    </span>
                    <span className="text-gray-400 line-through">
                        ${Number(product.originalPrice).toFixed(2)}
                    </span>
                    <span className="ml-1 text-xs bg-fuchsia-600 text-white px-2 py-1 rounded-full">
                        -{product.discount}%
                    </span>
                </>
            ) : (
                <span className="text-2xl font-bold text-white">
                    ${Number(product.price).toFixed(2)}
                </span>
            )}
        </div>
    );

    return (
        <div className="min-h-screen pt-24 bg-black text-white">
            <div className="max-w-6xl mx-auto px-4 md:px-6 mb-4">
                <Link to="/" className="text-sm text-fuchsia-400 hover:underline">
                    ← Back to store
                </Link>
            </div>

            <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {/* LEFT: Gallery */}
                <div className="md:sticky md:top-24 md:self-start">
                    <div className="grid grid-cols-5 gap-4">
                        <div className="hidden md:flex md:flex-col gap-3 col-span-1">
                            {images.map((img, i) => (
                                <motion.button
                                    key={i}
                                    onClick={() => setSelectedImage(img)}
                                    className={`aspect-square rounded-xl overflow-hidden border focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 ${selectedImage === img ? "border-fuchsia-500" : "border-zinc-800"
                                        }`}
                                    whileHover={{ y: -2 }}
                                >
                                    <img
                                        src={img}
                                        alt={`Thumb ${i + 1}`}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                    />
                                </motion.button>
                            ))}
                        </div>

                        {/* main image */}
                        <div className="col-span-5 md:col-span-4">
                            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900">
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={selectedImage}
                                        src={selectedImage}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                        initial={{ opacity: 0.3, scale: 1.02 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.25 }}
                                    />
                                </AnimatePresence>
                            </div>
                            {/* mobile thumbs */}
                            <div className="mt-3 flex md:hidden gap-3 overflow-x-auto no-scrollbar">
                                {images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedImage(img)}
                                        className={`h-16 w-16 flex-none rounded-lg overflow-hidden border ${selectedImage === img ? "border-fuchsia-500" : "border-zinc-800"
                                            }`}
                                    >
                                        <img
                                            src={img}
                                            alt={`Thumb ${i + 1}`}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Info */}
                <div className="flex flex-col gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold">{product.name}</h1>
                        <div className="mt-3">{priceBlock}</div>
                        {product.discount > 0 && (
                            <p className="text-xs text-gray-400 mt-1">
                                Tax/VAT calculated at checkout.
                            </p>
                        )}
                    </div>

                    {/* Size selector */}
                    {hasSizesSafe && (
                        <div role="radiogroup" aria-label="Select size">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-200">Select Size</h3>
                            </div>

                            <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
                                {["S", "M", "L", "XL"].map((sz) => {
                                    const stock = Number(product.sizes?.[sz] || 0);
                                    const disabled = stock <= 0;
                                    const selected = selectedSize === sz;
                                    return (
                                        <button
                                            key={sz}
                                            role="radio"
                                            aria-checked={selected}
                                            disabled={disabled}
                                            onClick={() => {
                                                setSelectedSize(sz);
                                                setSizeError("");
                                                if (quantity > stock) setQuantity(stock || 1);
                                            }}
                                            className={[
                                                "h-11 rounded-full border text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500",
                                                disabled
                                                    ? "border-zinc-800 text-zinc-600 bg-zinc-900 cursor-not-allowed"
                                                    : selected
                                                        ? "border-fuchsia-500 bg-fuchsia-600 text-white shadow-lg"
                                                        : "border-zinc-700 bg-zinc-800 text-gray-200 hover:border-fuchsia-500",
                                            ].join(" ")}
                                            title={disabled ? "Sold out" : `In stock: ${stock}`}
                                        >
                                            {sz}
                                            {disabled ? " · Sold out" : ""}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="min-h-[24px] mt-2" aria-live="polite">
                                {sizeError ? (
                                    <p className="text-xs text-amber-400">⚠ {sizeError}</p>
                                ) : (
                                    lowStockLabel && <p className="text-xs text-amber-400">{lowStockLabel}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Quantity */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-gray-200">Quantity</span>
                        <div className="inline-flex items-center overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
                            <button
                                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                className="px-3 py-2 hover:bg-zinc-700"
                                aria-label="Decrease quantity"
                            >
                                –
                            </button>
                            <input
                                className="w-12 text-center bg-transparent outline-none"
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => {
                                    const v = Math.max(1, Number(e.target.value || 1));
                                    setQuantity(currentStock ? Math.min(v, currentStock) : v);
                                }}
                            />
                            <button
                                onClick={() =>
                                    setQuantity((q) => (currentStock ? Math.min(currentStock, q + 1) : q + 1))
                                }
                                className="px-3 py-2 hover:bg-zinc-700"
                                aria-label="Increase quantity"
                            >
                                +
                            </button>
                        </div>
                        {currentStock > 0 && (
                            <span className="text-xs text-gray-400">Max: {currentStock}</span>
                        )}
                    </div>

                    {/* CTA */}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        whileHover={{ y: -1 }}
                        onClick={handleAdd}
                        disabled={hasSizesSafe ? !selectedSize || currentStock === 0 : currentStock === 0}
                        className="w-full md:w-auto px-6 py-3 rounded-xl font-bold bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-40 shadow-lg shadow-fuchsia-600/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
                    >
                        Add to Bag
                    </motion.button>

                    {/* Accordions */}
                    <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 overflow-hidden">
                        <Accordion title="Details">
                            <p className="text-gray-300 leading-relaxed">{product.description || "—"}</p>
                        </Accordion>
                        <Accordion title="Shipping & Returns">
                            <ul className="list-disc list-inside text-gray-300 space-y-1">
                                <li>Standard shipping 3–7 business days.</li>
                                <li>Tracking provided via email.</li>
                            </ul>
                        </Accordion>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Accordion({ title, children }) {
    const [open, setOpen] = useState(false);
    return (
        <div>
            <button
                onClick={() => setOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-900"
            >
                <span className="font-semibold">{title}</span>
                <span className="text-zinc-400">{open ? "−" : "+"}</span>
            </button>
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
