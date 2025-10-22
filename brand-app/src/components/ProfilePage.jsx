import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/authContext';
import { FaUserCircle, FaEnvelope, FaBoxOpen, FaShoppingBag, FaTimes, FaReceipt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = "https://clothing-backend.fly.dev";
const safeMoney = (v) => Number(v ?? 0).toFixed(2);
const getCover = (p) =>
    p?.coverImage ||
    "https://res.cloudinary.com/dkx4n6r0v/image/upload/v1710000000/milvnne-products/default.png";

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

    useEffect(() => {
        // No bloqueamos por userId; /mine usa el token
        fetchOrders();
        fetchSuggestedProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]); // si cambia el usuario, reintenta

    const fetchOrders = async () => {
        setLoadingOrders(true);
        setOrdersError("");
        try {
            const token = localStorage.getItem('token');
            console.log("[ProfilePage] token?", token ? `sí (${token.slice(0, 10)}...)` : "NO");
            if (!token) {
                setOrders([]);
                setOrdersError("Necesitas iniciar sesión para ver tus órdenes.");
                return;
            }

            const url = `${API_URL}/api/orders/mine`;
            console.log("[ProfilePage] GET", url);
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
            console.log("[/mine] órdenes:", data.length);

            // Si no llegaron órdenes, intentamos enlazar guest por email y reintentar
            if (data.length === 0) {
                console.log("[ProfilePage] 0 órdenes -> intento /orders/claim");
                const claimRes = await fetch(`${API_URL}/api/orders/claim`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    mode: "cors",
                });
                const claim = await claimRes.json().catch(() => ({}));
                console.log("[ProfilePage] claim:", claim);

                const res2 = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, mode: "cors" });
                data = await res2.json().catch(() => []);
                if (!Array.isArray(data)) data = [];
                console.log("[/mine] after claim:", data.length);
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
            setSuggestedProducts(Array.isArray(data) ? data.slice(0, 5) : []);
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

    const OrderSkeleton = () => (
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

    const toggleOrderDetails = (orderId) => {
        setExpandedOrderIds((prev) =>
            prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-slate-300 py-20 px-6">
            <div className="max-w-6xl mx-auto space-y-12">
                {/* Perfil & Pedidos */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-10"
                >
                    {/* Perfil */}
                    <div className="bg-gradient-to-br from-zinc-800/60 via-black/70 to-black/90 backdrop-blur-xl p-10 rounded-3xl shadow-2xl text-white space-y-8">
                        <div className="flex items-center gap-5">
                            <div className="bg-fuchsia-600/20 p-4 rounded-full shadow-md">
                                <FaUserCircle className="text-4xl text-fuchsia-400" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold tracking-tight">Hola, {user?.name}</h2>
                                <p className="text-sm text-gray-400">Bienvenido de nuevo 👋</p>
                            </div>
                        </div>

                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                        <div className="space-y-3 text-sm text-gray-300">
                            <div className="flex items-center gap-3">
                                <FaEnvelope className="text-fuchsia-400" />
                                <span>{user?.email}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <FaBoxOpen className="text-fuchsia-400" />
                                <span>
                                    Miembro desde:{" "}
                                    <span className="text-white font-medium">
                                        {new Date(user?.createdAt ?? Date.now()).toLocaleDateString()}
                                    </span>
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <FaShoppingBag className="text-fuchsia-400" />
                                <span>
                                    Órdenes realizadas:{" "}
                                    <span className="text-white font-medium">{orders.length}</span>
                                </span>
                            </div>
                        </div>

                        <div className="pt-6 flex gap-4">
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 rounded-full bg-zinc-800 text-gray-300 hover:bg-red-500 hover:text-white transition"
                            >
                                Cerrar Sesión
                            </button>
                        </div>

                        <div className="mt-6 text-gray-500 italic text-sm border-t border-white/10 pt-4">
                            “El estilo comienza con autenticidad.”
                        </div>
                        <Link to="/edit-profile" className="text-fuchsia-400 hover:underline mt-2 inline-block">
                            Editar Perfil
                        </Link>
                    </div>

                    {/* Órdenes */}
                    <div className="bg-gradient-to-br from-zinc-800/60 via-black/70 to-black/90 backdrop-blur-xl p-10 rounded-3xl shadow-2xl text-white">
                        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 text-white tracking-tight">
                            <FaReceipt className="text-fuchsia-400 text-xl" />
                            Tus órdenes
                        </h3>

                        {ordersError && (
                            <div className="mb-4 text-sm text-red-400 bg-red-900/20 border border-red-500/20 px-3 py-2 rounded">
                                {ordersError}{" "}
                                {!localStorage.getItem('token') && (
                                    <button
                                        className="underline text-fuchsia-300 ml-1"
                                        onClick={() => navigate('/login')}
                                    >
                                        Iniciar sesión
                                    </button>
                                )}
                            </div>
                        )}

                        {loadingOrders ? (
                            <div className="space-y-6">
                                <OrderSkeleton />
                                <OrderSkeleton />
                                <OrderSkeleton />
                            </div>
                        ) : orders.length === 0 ? (
                            <p className="text-gray-400 text-sm italic">Aún no tienes órdenes registradas.</p>
                        ) : (
                            <>
                                <div className="space-y-6">
                                    {recentOrders.map((order) => {
                                        const first = order.products?.[0];
                                        return (
                                            <motion.div
                                                key={order._id}
                                                onClick={() => {
                                                    setSelectedOrder(order);
                                                    setShowOrderModal(true);
                                                }}
                                                className="cursor-pointer relative rounded-2xl bg-zinc-900 border border-white/10 hover:border-fuchsia-400/40 p-5 shadow-xl hover:shadow-fuchsia-500/10 transition-all group"
                                                whileHover={{ scale: 1.015 }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <img
                                                        src={getCover(first?.product) || first?.coverImage}
                                                        alt="Producto"
                                                        className="w-16 h-16 object-cover rounded-xl border border-fuchsia-500 shadow-md"
                                                    />
                                                    <div className="flex-1">
                                                        <p className="text-sm font-semibold text-white flex items-center gap-2">
                                                            Orden #{order._id.slice(-6).toUpperCase()}
                                                            {order.products.length > 1 && (
                                                                <span className="text-xs flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded-full text-gray-400">
                                                                    <FaShoppingBag className="text-fuchsia-400" /> +{order.products.length - 1}
                                                                </span>
                                                            )}
                                                        </p>
                                                        <p className="text-sm text-gray-300 mt-1">
                                                            Estado: <span className="text-white">{order.status}</span>
                                                        </p>
                                                        <p className="text-sm text-gray-400">
                                                            Total: ${safeMoney(order.total ?? order.totalAmount)}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Fecha: {new Date(order.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}

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

                                    {showOrderModal && selectedOrder && (
                                        <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
                                            <div className="bg-zinc-900 text-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative">
                                                <button
                                                    onClick={() => setShowOrderModal(false)}
                                                    className="absolute top-3 right-3 text-gray-400 hover:text-white"
                                                >
                                                    <FaTimes />
                                                </button>
                                                <h2 className="text-xl font-bold mb-6">Detalles de Orden</h2>
                                                <div className="space-y-4">
                                                    {selectedOrder?.products?.map((item, idx) => (
                                                        <div key={idx} className="bg-zinc-800 p-4 rounded-xl flex items-center gap-4 shadow">
                                                            <img
                                                                src={getCover(item.product) || item.coverImage}
                                                                alt={item.product?.name || "Producto"}
                                                                className="w-12 h-12 object-cover rounded border border-fuchsia-500"
                                                            />
                                                            <div className="flex-1">
                                                                <p className="text-sm font-semibold text-white">
                                                                    {item.product?.name || "Producto"}
                                                                </p>
                                                                {item.size && <p className="text-xs text-gray-400">Talla: {item.size}</p>}
                                                                <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>

                {/* Recomendaciones */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="bg-gradient-to-br from-zinc-900 via-black to-zinc-950 rounded-3xl shadow-2xl p-10 backdrop-blur-md text-white"
                >
                    <h3 className="text-3xl font-extrabold mb-8 tracking-tight flex items-center gap-3 text-white">
                        <FaShoppingBag className="text-fuchsia-400 text-l" />
                        Recomendado para ti
                    </h3>

                    <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-fuchsia-500/30">
                        <div className="flex gap-8 w-max">
                            {suggestedProducts.map((product) => (
                                <motion.div
                                    key={product._id}
                                    whileHover={{ scale: 1.06 }}
                                    transition={{ type: "spring", stiffness: 180 }}
                                    onClick={() => navigate(`/product/${product._id}`)}
                                    className="relative group bg-zinc-900 rounded-3xl w-[230px] flex-shrink-0 cursor-pointer overflow-hidden shadow-lg hover:shadow-fuchsia-500/30 transition-all border border-white/10"
                                >
                                    <img
                                        src={getCover(product)}
                                        alt={product.name}
                                        className="w-full h-60 object-cover group-hover:brightness-110 transition duration-500"
                                    />

                                    {product.discount > 0 && (
                                        <div className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-full z-20 shadow-lg">
                                            -{product.discount}% OFF
                                        </div>
                                    )}

                                    <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/80 via-black/20 to-transparent px-4 py-4">
                                        <h4 className="text-white font-semibold text-[15px] truncate">{product.name}</h4>
                                        {product.discount > 0 ? (
                                            <div className="flex items-center gap-2 text-sm mt-1">
                                                <span className="line-through text-gray-400 text-xs">
                                                    ${safeMoney(product.originalPrice)}
                                                </span>
                                                <span className="text-fuchsia-400 font-bold">${safeMoney(product.price)}</span>
                                            </div>
                                        ) : (
                                            <p className="text-fuchsia-400 font-semibold text-sm mt-1">
                                                ${safeMoney(product.price)}
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>

            {showAllOrders && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center px-4">
                    <div className="bg-gradient-to-br from-zinc-900 via-black to-zinc-950 text-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl p-8 relative border border-white/10">
                        <button
                            onClick={() => setShowAllOrders(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-fuchsia-400 transition text-xl"
                            aria-label="Cerrar historial"
                        >
                            <FaTimes />
                        </button>

                        <h2 className="text-2xl font-bold mb-6 text-fuchsia-400 tracking-tight">Historial de Órdenes</h2>

                        <div className="space-y-5 divide-y divide-white/10">
                            {olderOrders.map((order) => {
                                const first = order.products?.[0];
                                return (
                                    <div key={order._id} className="pt-5 px-3 py-2 rounded-xl transition hover:bg-white/5">
                                        <div className="flex items-center gap-4 cursor-pointer" onClick={() => toggleOrderDetails(order._id)}>
                                            {first?.product ? (
                                                <img
                                                    src={getCover(first.product) || first.coverImage}
                                                    alt={first.product?.name || "Producto"}
                                                    className="w-16 h-16 object-cover rounded-xl border border-fuchsia-500 shadow"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 flex items-center justify-center bg-zinc-800 text-xs text-gray-400 italic border border-zinc-600 rounded-xl shadow">
                                                    Eliminado
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <p className="text-sm font-semibold text-white flex items-center gap-2">
                                                    Orden #{order._id.slice(-6).toUpperCase()}
                                                    {order.products.length > 1 && (
                                                        <span className="text-xs flex items-center gap-1 bg-zinc-800 px-2 py-1 rounded-full text-gray-400">
                                                            <FaShoppingBag className="text-fuchsia-400" /> +{order.products.length - 1}
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-fuchsia-400 mt-1">Estado: {order.status}</p>
                                                <p className="text-xs text-gray-300">Total: ${safeMoney(order.total ?? order.totalAmount)}</p>
                                                <p className="text-[11px] text-gray-500 mt-1">Fecha: {new Date(order.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        {expandedOrderIds.includes(order._id) && (
                                            <div className="mt-4 ml-20 space-y-3">
                                                {order.products.map((item, idx) => (
                                                    <div key={idx} className="flex items-center gap-4 bg-zinc-800 p-3 rounded-xl border border-white/10 shadow">
                                                        <img
                                                            src={getCover(item.product) || item.coverImage}
                                                            alt={item.product?.name || "Producto"}
                                                            className="w-12 h-12 object-cover rounded border border-fuchsia-500"
                                                        />
                                                        <div>
                                                            <p className="text-sm text-white font-semibold">{item.product?.name || "Producto eliminado"}</p>
                                                            {item.size && <p className="text-xs text-gray-400">Talla: {item.size}</p>}
                                                            <p className="text-xs text-gray-500">Cantidad: {item.quantity}</p>
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
