import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/authContext';
import { FaUserCircle, FaEnvelope, FaBoxOpen, FaShoppingBag, FaTimes, FaReceipt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
    const { user, logout } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [suggestedProducts, setSuggestedProducts] = useState([]);
    const [showAllOrders, setShowAllOrders] = useState(false);
    const navigate = useNavigate();
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);

    useEffect(() => {
        if (user && user._id) {
            fetchOrders();
            fetchSuggestedProducts();
        }
    }, [user]);

    const fetchOrders = async () => {
        try {
            const res = await fetch(`http://localhost:8080/api/orders/user/${user._id}`, {
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
            const res = await fetch('http://localhost:8080/api/products');
            const data = await res.json();
            setSuggestedProducts(data.slice(0, 5));
        } catch (error) {
            console.error('Error fetching suggested products:', error);
        }
    };

    const recentOrders = orders.slice(0, 3);
    const olderOrders = orders.slice(3);

    const handleLogout = () => {
        logout();        // Llama la función del contexto que hace el logout real
        navigate('/');   // Te manda a la página principal
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-slate-300 py-20 px-6">
            <div className="max-w-6xl mx-auto space-y-12">

                {/* 🧍 Perfil & Pedidos */}
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
                                <span>Miembro desde: <span className="text-white font-medium">{new Date(user?.createdAt).toLocaleDateString()}</span></span>
                            </div>
                            <div className="flex items-center gap-3">
                                <FaShoppingBag className="text-fuchsia-400" />
                                <span>Órdenes realizadas: <span className="text-white font-medium">{orders.length}</span></span>
                            </div>
                        </div>

                        <div className="pt-6 flex gap-4">
                            {/* <button
                                onClick={() => navigate('/edit-profile')}
                                className="px-4 py-2 rounded-full bg-white text-black font-semibold hover:bg-fuchsia-500 hover:text-white transition"
                            >
                                Editar Perfil
                            </button> */}
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
                    </div>



                    {/* Órdenes */}
                    <div className="bg-gradient-to-br from-zinc-800/60 via-black/70 to-black/90 backdrop-blur-xl p-10 rounded-3xl shadow-2xl text-white">
                        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 text-white tracking-tight">
                            <FaReceipt className="text-fuchsia-400 text-xl" />
                            Tus órdenes
                        </h3>

                        {orders.length === 0 ? (
                            <p className="text-gray-400 text-sm italic">Aún no tienes órdenes registradas.</p>
                        ) : (
                            <>
                                <div className="space-y-6">
                                    {recentOrders.map((order) => (
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
                                                    src={`http://localhost:8080${order.products[0]?.product?.coverImage || "/uploads/default.png"}`}
                                                    alt="Producto"
                                                    className="w-16 h-16 object-cover rounded-xl border border-fuchsia-500 shadow-md"
                                                />
                                                <div className="flex-1">
                                                    <h4 className="text-sm font-semibold text-fuchsia-400">
                                                        #{order._id.slice(-6).toUpperCase()}
                                                    </h4>
                                                    <p className="text-sm text-gray-300 mt-1">Estado: <span className="text-white">{order.status}</span></p>
                                                    <p className="text-sm text-gray-400">Total: ${order.total.toFixed(2)}</p>
                                                    <p className="text-xs text-gray-500 mt-1">Fecha: {new Date(order.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
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
                                                    {selectedOrder.products.map((item, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="bg-zinc-800 p-4 rounded-xl flex items-center gap-4 shadow"
                                                        >
                                                            <img
                                                                src={`http://localhost:8080${item.product?.coverImage || "/uploads/default.png"}`}
                                                                alt={item.product?.name}
                                                                className="w-12 h-12 object-cover rounded border border-fuchsia-500"
                                                            />
                                                            <div className="flex-1">
                                                                <p className="text-sm font-semibold text-white">{item.product?.name}</p>
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

                {/* 🎯 Recomendaciones */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="bg-gradient-to-br from-zinc-800/60 via-zinc-900/70 to-black/80 rounded-3xl shadow-2xl p-10 backdrop-blur-md text-white"
                >
                    <h3 className="text-2xl font-bold mb-8 tracking-tight flex items-center gap-3 text-white">
                        <FaShoppingBag className="text-fuchsia-400 text-xl" />
                        Recomendado para ti
                    </h3>

                    <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-fuchsia-500/30">
                        <div className="flex gap-6 w-max">
                            {suggestedProducts.map((product) => (
                                <motion.div
                                    key={product._id}
                                    whileHover={{ scale: 1.07, rotate: 0.5 }}
                                    transition={{ type: "spring", stiffness: 200 }}
                                    onClick={() => navigate(`/product/${product._id}`)}
                                    className="relative group bg-neutral-900 rounded-2xl w-[220px] flex-shrink-0 cursor-pointer overflow-hidden shadow-lg hover:shadow-fuchsia-500/30 transition-all"
                                >
                                    {/* Imagen */}
                                    <img
                                        src={`http://localhost:8080${product.coverImage}`}
                                        alt={product.name}
                                        className="w-full h-56 object-cover group-hover:brightness-110 transition duration-500"
                                    />

                                    {/* Overlay negro */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80 z-10"></div>

                                    {/* Badge de descuento */}
                                    {product.discount > 0 && (
                                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full z-30">
                                            -{product.discount}% OFF
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="absolute bottom-4 left-4 z-20 space-y-1">
                                        <h4 className="text-white font-bold text-sm leading-tight">
                                            {product.name}
                                        </h4>
                                        {product.discount > 0 ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs line-through text-gray-400">${Number(product.originalPrice).toFixed(2)}</span>
                                                <span className="text-fuchsia-400 font-bold text-sm">${Number(product.price).toFixed(2)}</span>
                                            </div>
                                        ) : (
                                            <p className="text-fuchsia-400 font-bold text-sm">${Number(product.price).toFixed(2)}</p>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                </motion.div>

            </div>
            {showAllOrders && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
                    <div className="bg-zinc-900 text-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative">
                        <button
                            onClick={() => setShowAllOrders(false)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-white"
                        >
                            <FaTimes />
                        </button>
                        <h2 className="text-xl font-bold mb-6">Historial de Órdenes</h2>

                        <div className="space-y-4">
                            {olderOrders.map((order) => (
                                <div
                                    key={order._id}
                                    onClick={() => {
                                        setSelectedOrder(order);
                                        setShowOrderModal(true);
                                    }}
                                    className="cursor-pointer bg-zinc-800 p-4 rounded-xl flex items-center gap-4 shadow"
                                >
                                    <img
                                        src={`http://localhost:8080${order.products[0]?.product?.coverImage || "/uploads/default.png"}`}
                                        alt="Producto"
                                        className="w-12 h-12 object-cover rounded border border-fuchsia-500"
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-mono text-white">ID: {order._id}</p>
                                        <p className="text-sm text-fuchsia-400">Estado: {order.status}</p>
                                        <p className="text-sm text-gray-300">Total: ${order.total.toFixed(2)}</p>
                                        <p className="text-xs text-gray-500">Fecha: {new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* 🪟 Modal para ver todas las órdenes */}
            {/* {showAllOrders && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center">
                    <div className="bg-zinc-900 text-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto relative">
                        <button
                            onClick={() => setShowAllOrders(false)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-white"
                        >
                            <FaTimes />
                        </button>
                        <h2 className="text-xl font-bold mb-6">Historial de Órdenes</h2>

                    </div>
                </div>
            )} */}
        </div>
    );
};

export default ProfilePage;
