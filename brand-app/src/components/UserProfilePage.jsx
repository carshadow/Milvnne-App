import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/authContext";

const UserProfilePage = () => {
    const { user } = useContext(AuthContext);
    const [address, setAddress] = useState(user?.address || "");
    const token = localStorage.getItem("token");
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [linking, setLinking] = useState(false);

    const handleSave = () => {
        // Aquí puedes hacer la lógica para actualizar la dirección
        console.log("Address saved:", address);
    };
    const fetchMyOrders = async () => {
        if (!token) return;
        setLoadingOrders(true);
        try {
            const res = await fetch("https://clothing-backend.fly.dev/api/orders/mine", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setOrders(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Error fetching my orders:", e);
            setOrders([]);
        } finally {
            setLoadingOrders(false);
        }
    };

    useEffect(() => { fetchMyOrders(); }, [token]);

    const handleClaimGuestOrders = async () => {
        if (!token) return;
        setLinking(true);
        try {
            const res = await fetch("https://clothing-backend.fly.dev/api/orders/claim", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json(); // { matched, linked }
            await fetchMyOrders();
            alert(`Órdenes enlazadas: ${data.linked} (encontradas: ${data.matched})`);
        } catch (e) {
            console.error("Error claiming guest orders:", e);
            alert("No se pudieron enlazar las órdenes de invitado.");
        } finally {
            setLinking(false);
        }
    };


    return (
        <div className="p-6 max-w-md mx-auto">
            <h1 className="text-2xl font-semibold mb-4">User Profile</h1>
            <div className="mb-4">
                <label className="block">Address</label>
                <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2 border rounded"
                />
            </div>
            <button onClick={handleSave} className="bg-blue-500 text-white p-2 rounded">
                Save Address
            </button>
            <div className="mt-8 bg-zinc-800 p-4 rounded-xl text-white">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-semibold">Mis órdenes</h2>
                    <button
                        onClick={handleClaimGuestOrders}
                        disabled={linking}
                        className="bg-zinc-700 hover:bg-zinc-600 px-3 py-2 rounded"
                    >
                        {linking ? "Enlazando..." : "Enlazar órdenes de invitado"}
                    </button>
                </div>

                {loadingOrders ? (
                    <p className="text-gray-300">Cargando órdenes…</p>
                ) : orders.length === 0 ? (
                    <p className="text-gray-300">No tienes órdenes todavía.</p>
                ) : (
                    <div className="space-y-3">
                        {orders.map((o) => (
                            <div key={o._id} className="bg-black/30 p-3 rounded">
                                <div className="flex justify-between text-sm text-gray-300">
                                    <span>Orden: <span className="text-white">{o._id}</span></span>
                                    <span>{new Date(o.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="mt-1 text-sm">
                                    <span className="mr-3">Status: <b className="text-fuchsia-400">{o.status}</b></span>
                                    <span>Total: <b>${Number(o.total).toFixed(2)}</b></span>
                                </div>
                                <div className="mt-2 text-sm text-gray-300">
                                    {o.products?.map((p, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            {p.coverImage && (
                                                <img src={p.coverImage} alt="" className="w-10 h-10 object-cover rounded" />
                                            )}
                                            <span>Qty: {p.quantity}{p.size ? ` • Talla: ${p.size}` : ""}</span>
                                            <span className="text-xs text-gray-400">ID prod: {p.product}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>

    );
};

export default UserProfilePage;
