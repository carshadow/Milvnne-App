import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../context/authContext';
import {
    FaUserCircle, FaEnvelope, FaBoxOpen, FaShoppingBag, FaTimes,
    FaReceipt, FaSignOutAlt, FaChevronRight, FaChevronDown
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = "https://clothing-backend.fly.dev";
const safeMoney = (v) => Number(v ?? 0).toFixed(2);
const getCover = (p) =>
    p?.coverImage ||
    "https://res.cloudinary.com/dkx4n6r0v/image/upload/v1710000000/milvnne-products/default.png";

const chipStyle = (status = '') => {
    const s = status.toLowerCase();
    if (s.includes('entregada')) return 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30';
    if (s.includes('en camino')) return 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30';
    if (s.includes('paid') || s.includes('pag')) return 'bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-500/30';
    return 'bg-zinc-700/30 text-zinc-300 ring-1 ring-white/10';
};

const Divider = () => (
    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
);

const SkeletonCard = () => (
    <div className="animate-pulse rounded-2xl bg-zinc-900 border border-white/10 p-5 shadow-xl">
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-zinc-700 rounded-xl" />
            <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-700 rounded w-3/4" />
                <div className="h-3 bg-zinc-700 rounded w-1/2" />
                <div className="h-3 bg-zinc-800 rounded w-1/3" />
            </div>
        </div>
    </div>
);

const ProfilePage = () => {
    const { user, logout } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [suggestedProducts, setSuggestedProducts] = useState([]);
    const [showAllOrders, setShowAllOrders] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [expandedOrderIds, setExpandedOrderIds] = useState([]);
    const [ordersError, setOrdersError] = useState("");
    const navigate = useNavigate();

    const reduceMotion =
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    useEffect(() => {
        fetchOrders();
        fetchSuggestedProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchOrders = async () => {
        setLoadingOrders(true);
        setOrdersError("");
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setOrders([]);
                setOrdersError("Necesitas iniciar sesión para ver tus órdenes.");
                return;
            }

            const url = `${API_URL}/api/orders/mine`;
            let res = await fetch(url, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
                mode: "cors",
            });

            if (!res.ok) {
                const txt = await res.text().catch(() => "");
                console.error("[/mine] status:", res.status, "body:", txt);
                if (res.status === 401 || res.status === 403) {
                    setOrders([]);
                    setOrdersError("Tu sesión expiró. Vuelve a iniciar sesión.");
                    return;
                }
                setOrders([]);
                setOrdersError("No se pudieron cargar tus órdenes.");
                return;
            }

            let data = await res.json().catch(() => []);
            if (!Array.isArray(data)) data = [];

            // Intento de claim si viene vacío
            if (data.length === 0) {
                const claimRes = await fetch(`${API_URL}/api/orders/claim`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    mode: "cors",
                });
                await claimRes.json().catch(() => ({}));
                const res2 = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, mode: "cors" });
                data = await res2.json().catch(() => []);
                if (!Array.isArray(data)) data = [];
            }

            setOrders(data);
        } catch (err) {
            console.error("Error fetching orders:", err);
            setOrders([]);
            setOrdersError("Error de red al cargar tus órdenes.");
        } finally {
            setLoadingOrders(false);
        }
    };

    const fetchSuggestedProducts = async () => {
        try {
            const res = await fetch(`${API_URL}/api/products`, { mode: "cors" });
            const data = await res.json();
            setSuggestedProducts(Array.isArray(data) ? data.slice(0, 8) : []);
        } catch (error) {
            console.error('Error fetching suggested products:', error);
        }
    };

    const recentOrders = orders.slice(0, 3);
    const olderOrders = orders.slice(3);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const toggleOrderDetails = (orderId) => {
        setExpandedOrderIds((prev) =>
            prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
        );
    };

    const Stat = ({ label, value }) => (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <div className="text-xl font-semibold text-white">{value}</div>
            <div className="text-xs uppercase tracking-wider text-gray-400">{label}</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-slate-300 pb-24 pt-16">
            <div className="mx-auto w-full max-w-6xl px-6 space-y-12">
                {/* ===== HEADER ===== */}
                <header className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/80 via-black/80 to-zinc-900/80 backdrop-blur-xl p-6 sm:p-10 shadow-2xl">
                    <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-fuchsia-600 to-indigo-600 blur opacity-40" />
                                <div className="relative rounded-full bg-zinc-900 p-3 ring-1 ring-white/10">
                                    <FaUserCircle className="text-5xl text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                                    Hola, {user?.name}
                                </h1>
                                <p className="text-sm text-gray-400">Bienvenido de nuevo 👋</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                to="/edit-profile"
                                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-gray-200 hover:bg-white/10 transition"
                            >
                                Editar perfil
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 rounded-full bg-zinc-800 px-4 py-2 text-sm text-gray-200 ring-1 ring-white/10 hover:bg-red-500 hover:text-white hover:ring-red-400/40 transition"
                            >
                                <FaSignOutAlt /> Cerrar sesión
                            </button>
                        </div>
                    </div>

                    <Divider />

                    <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4 md:max-w-lg">
                        <Stat label="Órdenes" value={orders.length} />
                        <Stat
                            label="Miembro desde"
                            value={new Date(user?.createdAt ?? Date.now()).toLocaleDateString()}
                        />
                        <Stat label="Email" value={(user?.email || '').split('@')[0]} />
                    </div>
                </header>

                {/* ===== CONTENT GRID ===== */}
                <motion.section
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.5 }}
                    className="grid grid-cols-1 gap-10 md:grid-cols-2"
                >
                    {/* === ORDERS CARD === */}
                    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/70 via-black/70 to-zinc-900/70 backdrop-blur-xl p-6 sm:p-8 text-white shadow-2xl">
                        <h2 className="mb-6 flex items-center gap-3 text-xl sm:text-2xl font-bold tracking-tight">
                            <FaReceipt className="text-fuchsia-400" /> Tus órdenes
                        </h2>

                        {ordersError && (
                            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-900/20 px-3 py-2 text-sm text-red-300">
                                {ordersError}{" "}
                                {!localStorage.getItem('token') && (
                                    <button
                                        className="ml-1 underline text-fuchsia-300"
                                        onClick={() => navigate('/login')}
                                    >
                                        Iniciar sesión
                                    </button>
                                )}
                            </div>
                        )}

                        {loadingOrders ? (
                            <div className="space-y-4">
                                <SkeletonCard />
                                <SkeletonCard />
                                <SkeletonCard />
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                                <p className="text-gray-300">Aún no tienes órdenes registradas.</p>
                                <Link
                                    to="/"
                                    className="mt-4 inline-block rounded-full bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white hover:bg-fuchsia-700 transition"
                                >
                                    Empezar a comprar
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4">
                                    {recentOrders.map((order) => {
                                        const first = order.products?.[0];
                                        return (
                                            <motion.button
                                                key={order._id}
                                                onClick={() => { setSelectedOrder(order); setShowOrderModal(true); }}
                                                whileHover={{ scale: reduceMotion ? 1 : 1.01 }}
                                                className="group w-full text-left rounded-2xl border border-white/10 bg-zinc-900 p-5 shadow-xl ring-0 hover:border-fuchsia-400/40 hover:shadow-fuchsia-500/10 transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={getCover(first?.product) || first?.coverImage}
                                                        alt="Producto"
                                                        className="h-16 w-16 rounded-xl object-cover border border-fuchsia-500/60 shadow-md"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 text-sm font-semibold">
                                                            <span className="text-white">Orden #{order._id.slice(-6).toUpperCase()}</span>
                                                            {order.products.length > 1 && (
                                                                <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-gray-400">
                                                                    +{order.products.length - 1} ítems
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
                                                            <span className={`rounded-full px-2 py-0.5 ${chipStyle(order.status)}`}>
                                                                {order.status}
                                                            </span>
                                                            <span className="text-gray-400">Total: ${safeMoney(order.total ?? order.totalAmount)}</span>
                                                            <span className="text-gray-500 text-xs">
                                                                {new Date(order.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <FaChevronRight className="text-zinc-500 group-hover:text-fuchsia-400 transition" />
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>

                                {orders.length > 3 && (
                                    <div className="mt-6 text-center">
                                        <button
                                            onClick={() => setShowAllOrders(true)}
                                            className="text-sm text-fuchsia-400 hover:text-white hover:underline transition"
                                        >
                                            Ver historial completo
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* === SUGGESTIONS === */}
                    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/70 via-black/70 to-zinc-900/70 backdrop-blur-xl p-6 sm:p-8 text-white shadow-2xl">
                        <h2 className="mb-6 flex items-center gap-3 text-xl sm:text-2xl font-bold tracking-tight">
                            <FaShoppingBag className="text-fuchsia-400" /> Recomendado para ti
                        </h2>

                        <div className="overflow-x-auto pb-2 [scrollbar-width:thin] [scrollbar-color:theme(colors.fuchsia.500)_transparent]">
                            <div className="flex w-max gap-6">
                                {suggestedProducts.map((product) => (
                                    <motion.article
                                        key={product._id}
                                        whileHover={{ scale: reduceMotion ? 1 : 1.04 }}
                                        transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                                        onClick={() => navigate(`/product/${product._id}`)}
                                        className="group relative w-[220px] cursor-pointer overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-xl"
                                    >
                                        <img
                                            src={getCover(product)}
                                            alt={product.name}
                                            className="h-60 w-full object-cover transition duration-500 group-hover:brightness-110"
                                            loading="lazy"
                                            decoding="async"
                                        />
                                        {product.discount > 0 && (
                                            <div className="absolute left-3 top-3 z-10 rounded-full bg-red-600 px-3 py-1 text-[11px] font-bold text-white shadow">
                                                -{product.discount}% OFF
                                            </div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent px-4 py-3">
                                            <h3 className="truncate text-[15px] font-semibold">{product.name}</h3>
                                            {product.discount > 0 ? (
                                                <div className="mt-1 flex items-center gap-2 text-sm">
                                                    <span className="text-xs text-gray-400 line-through">
                                                        ${safeMoney(product.originalPrice)}
                                                    </span>
                                                    <span className="font-bold text-fuchsia-400">
                                                        ${safeMoney(product.price)}
                                                    </span>
                                                </div>
                                            ) : (
                                                <p className="mt-1 text-sm font-semibold text-fuchsia-400">
                                                    ${safeMoney(product.price)}
                                                </p>
                                            )}
                                        </div>
                                    </motion.article>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.section>
            </div>

            {/* ===== MODAL: ORDEN DETALLE ===== */}
            {showOrderModal && selectedOrder && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    onClick={() => setShowOrderModal(false)}
                >
                    <div
                        className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-zinc-950 p-6 text-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowOrderModal(false)}
                            className="absolute right-4 top-4 text-gray-400 hover:text-white transition"
                            aria-label="Cerrar"
                        >
                            <FaTimes />
                        </button>

                        <h3 className="mb-2 text-xl font-bold">Detalles de la orden #{selectedOrder._id.slice(-6).toUpperCase()}</h3>
                        <div className="mb-4 flex items-center gap-2 text-sm">
                            <span className={`rounded-full px-2 py-0.5 ${chipStyle(selectedOrder.status)}`}>
                                {selectedOrder.status}
                            </span>
                            <span className="text-gray-400">
                                {new Date(selectedOrder.createdAt).toLocaleString()}
                            </span>
                        </div>
                        <Divider />

                        <div className="mt-4 space-y-3">
                            {selectedOrder?.products?.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 rounded-xl border border-white/10 bg-zinc-900 p-3 shadow">
                                    <img
                                        src={getCover(item.product) || item.coverImage}
                                        alt={item.product?.name || "Producto"}
                                        className="h-12 w-12 rounded object-cover ring-1 ring-fuchsia-500/50"
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold">{item.product?.name || "Producto"}</p>
                                        <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                            {item.size && <span>Talla: {item.size}</span>}
                                            <span>Cantidad: {item.quantity}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Divider />
                        <div className="mt-4 flex items-center justify-between text-sm">
                            <span className="text-gray-400">Total</span>
                            <span className="text-white font-semibold">
                                ${safeMoney(selectedOrder.total ?? selectedOrder.totalAmount)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== MODAL: HISTORIAL COMPLETO ===== */}
            {showAllOrders && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
                    onClick={() => setShowAllOrders(false)}
                >
                    <div
                        className="relative max-h-[87vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 via-black to-zinc-950 p-6 text-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setShowAllOrders(false)}
                            className="absolute right-4 top-4 text-gray-400 hover:text-fuchsia-400 transition text-xl"
                            aria-label="Cerrar historial"
                        >
                            <FaTimes />
                        </button>

                        <h3 className="mb-2 text-2xl font-bold tracking-tight text-fuchsia-400">Historial de Órdenes</h3>
                        <p className="mb-4 text-sm text-gray-400">Toca una orden para ver/ocultar sus detalles.</p>
                        <Divider />

                        <div className="mt-4 space-y-3">
                            {olderOrders.map((order) => {
                                const first = order.products?.[0];
                                const isOpen = expandedOrderIds.includes(order._id);
                                return (
                                    <div key={order._id} className="rounded-xl transition hover:bg-white/5">
                                        <button
                                            onClick={() => toggleOrderDetails(order._id)}
                                            className="flex w-full items-center gap-4 p-3 text-left"
                                        >
                                            {first?.product ? (
                                                <img
                                                    src={getCover(first.product) || first.coverImage}
                                                    alt={first.product?.name || "Producto"}
                                                    className="h-14 w-14 rounded-xl object-cover border border-fuchsia-500/50"
                                                />
                                            ) : (
                                                <div className="h-14 w-14 rounded-xl border border-zinc-600 bg-zinc-800 text-xs text-gray-400 grid place-content-center">
                                                    Eliminado
                                                </div>
                                            )}

                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 text-sm font-semibold">
                                                    <span className="text-white">Orden #{order._id.slice(-6).toUpperCase()}</span>
                                                    {order.products.length > 1 && (
                                                        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-gray-400">
                                                            +{order.products.length - 1} ítems
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                                                    <span className={`rounded-full px-2 py-0.5 ${chipStyle(order.status)}`}>{order.status}</span>
                                                    <span className="text-gray-400">
                                                        Total: ${safeMoney(order.total ?? order.totalAmount)}
                                                    </span>
                                                    <span className="text-gray-500">
                                                        {new Date(order.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {isOpen ? (
                                                <FaChevronDown className="text-zinc-500" />
                                            ) : (
                                                <FaChevronRight className="text-zinc-500" />
                                            )}
                                        </button>

                                        {isOpen && (
                                            <div className="mx-3 mb-3 space-y-3 rounded-xl border border-white/10 bg-zinc-900 p-3">
                                                {order.products.map((item, idx) => (
                                                    <div key={idx} className="flex items-center gap-4 rounded-xl border border-white/10 bg-zinc-900 p-3 shadow">
                                                        <img
                                                            src={getCover(item.product) || item.coverImage}
                                                            alt={item.product?.name || "Producto"}
                                                            className="h-12 w-12 rounded object-cover ring-1 ring-fuchsia-500/50"
                                                        />
                                                        <div className="flex-1">
                                                            <p className="text-sm font-semibold">{item.product?.name || "Producto eliminado"}</p>
                                                            <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                                                                {item.size && <span>Talla: {item.size}</span>}
                                                                <span>Cantidad: {item.quantity}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
