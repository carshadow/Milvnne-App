import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/authContext';
import { FaUserCircle, FaEnvelope, FaBoxOpen, FaShoppingBag, FaTimes, FaReceipt } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const ProfilePage = () => {
    const { user, logout } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [suggestedProducts, setSuggestedProducts] = useState([]);
    const [showAllOrders, setShowAllOrders] = useState(false);
    const navigate = useNavigate();
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [loadingOrders, setLoadingOrders] = useState(true);

    useEffect(() => {
        if (user && user._id) {
            fetchOrders();
            fetchSuggestedProducts();
        }
    }, [user]);

    const fetchOrders = async () => {
        setLoadingOrders(true);
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
        } finally {
            setLoadingOrders(false);
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

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-slate-300 py-20 px-6">
            <div className="max-w-6xl mx-auto space-y-12">

                {/*  Perfil & Pedidos */}
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
                        <Link
                            to="/edit-profile"
                            className="text-fuchsia-400 hover:underline mt-2 inline-block"
                        >
                            Editar Perfil
                        </Link>
                    </div>



                    {/* Órdenes */}
                    <div className="bg-gradient-to-br from-zinc-800/60 via-black/70 to-black/90 backdrop-blur-xl p-10 rounded-3xl shadow-2xl text-white">
                        <h3 className="text-2xl font-bold mb-8 flex items-center gap-3 text-white tracking-tight">
                            <FaReceipt className="text-fuchsia-400 text-xl" />
                            Tus órdenes
                        </h3>

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
                                                    src={order.products[0]?.product?.coverImage || "https://res.cloudinary.com/dkx4n6r0v/image/upload/v1710000000/milvnne-products/default.png"}

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
                                                                src={item.product?.coverImage || "https://res.cloudinary.com/dkx4n6r0v/image/upload/v1710000000/milvnne-products/default.png"}

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
                {/*  Recomendaciones */}
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
                                    {/* Imagen */}
                                    <img
                                        src={product.coverImage}
                                        alt={product.name}
                                        className="w-full h-60 object-cover group-hover:brightness-110 transition duration-500"
                                    />

                                    {/* Badge de descuento */}
                                    {product.discount > 0 && (
                                        <div className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-full z-20 shadow-lg">
                                            -{product.discount}% OFF
                                        </div>
                                    )}

                                    {/* Detalle inferior */}
                                    <div className="absolute inset-x-0 bottom-0 z-30 bg-gradient-to-t from-black/80 via-black/20 to-transparent px-4 py-4">
                                        <h4 className="text-white font-semibold text-[15px] truncate">
                                            {product.name}
                                        </h4>
                                        {product.discount > 0 ? (
                                            <div className="flex items-center gap-2 text-sm mt-1">
                                                <span className="line-through text-gray-400 text-xs">
                                                    ${Number(product.originalPrice).toFixed(2)}
                                                </span>
                                                <span className="text-fuchsia-400 font-bold">
                                                    ${Number(product.price).toFixed(2)}
                                                </span>
                                            </div>
                                        ) : (
                                            <p className="text-fuchsia-400 font-semibold text-sm mt-1">
                                                ${Number(product.price).toFixed(2)}
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

                        {/* Cerrar */}
                        <button
                            onClick={() => setShowAllOrders(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-fuchsia-400 transition text-xl"
                            aria-label="Cerrar historial"
                        >
                            <FaTimes />
                        </button>

                        {/* Título */}
                        <h2 className="text-2xl font-bold mb-6 text-fuchsia-400 tracking-tight">
                            Historial de Órdenes
                        </h2>

                        {/* Lista de Órdenes */}
                        <div className="space-y-5 divide-y divide-white/10">
                            {olderOrders.map((order) => (
                                <div
                                    key={order._id}
                                    onClick={() => {
                                        setSelectedOrder(order);
                                        setShowOrderModal(true);
                                    }}
                                    className="pt-5 flex items-center gap-4 cursor-pointer hover:bg-white/5 px-3 py-2 rounded-xl transition"
                                >
                                    {order.products[0]?.product ? (
                                        <img
                                            src={order.products[0].product.coverImage}
                                            alt={order.products[0].product.name}
                                            className="w-16 h-16 object-cover rounded-xl border border-fuchsia-500 shadow"
                                        />
                                    ) : (
                                        <div className="w-16 h-16 flex items-center justify-center bg-zinc-800 text-xs text-gray-400 italic border border-zinc-600 rounded-xl shadow">
                                            Eliminado
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-white">
                                            Orden #{order._id.slice(-6).toUpperCase()}
                                        </p>
                                        <p className="text-xs text-fuchsia-400 mt-1">Estado: {order.status}</p>
                                        <p className="text-xs text-gray-300">Total: ${order.total.toFixed(2)}</p>
                                        <p className="text-[11px] text-gray-500 mt-1">
                                            Fecha: {new Date(order.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                            ))}

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
