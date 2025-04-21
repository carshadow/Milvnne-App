import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // 👈 agrega useNavigate
import { motion } from "framer-motion";

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate(); // 👈 inicializa navigate
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("Procesando...");

        try {
            const res = await fetch(`http://localhost:8080/api/users/reset-password/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password: newPassword }),
            });

            const data = await res.json();

            if (res.ok) {
                setMessage("Contraseña actualizada correctamente ✅");
                setTimeout(() => navigate("/login"), 2000); // 👈 redirige después de 2 segundos
            } else {
                setMessage(data.message || "Error actualizando la contraseña");
            }
        } catch (err) {
            setMessage("Error al actualizar la contraseña");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-slate-800 px-4">
            <motion.div
                className="w-full max-w-md bg-zinc-900 text-white p-8 rounded-2xl shadow-2xl border border-zinc-700"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl font-bold text-center mb-6 text-fuchsia-400">Cambia tu contraseña</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <input
                        type="password"
                        placeholder="Nueva contraseña"
                        className="w-full p-3 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                    />
                    <button
                        type="submit"
                        className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3 rounded-lg shadow-lg uppercase"
                    >
                        Actualizar
                    </button>
                    {message && <p className="text-center text-green-400 text-sm">{message}</p>}
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
