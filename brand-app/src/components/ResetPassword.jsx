import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("Procesando...");
        setError("");

        try {
            //  Primero obtener el CSRF token
            const csrfRes = await fetch("https://clothing-backend.fly.dev/api/csrf-token", {
                credentials: "include",
            });
            const csrfData = await csrfRes.json();
            const csrfToken = csrfData.csrfToken;

            // Luego hacer el reset password enviando el CSRF token
            const res = await fetch(`https://clothing-backend.fly.dev/api/users/reset-password/${token}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "CSRF-Token": csrfToken, // Asegurando CSRF protection
                },
                body: JSON.stringify({ password: newPassword }),
                credentials: "include",
            });

            const data = await res.json();

            if (res.ok) {
                setMessage("✅ Contraseña actualizada correctamente.");
                setTimeout(() => navigate("/login"), 2000);
            } else {
                setError(data.message || "Error actualizando la contraseña");
                setMessage("");
            }
        } catch (err) {
            setError("❌ Error de red o servidor");
            setMessage("");
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

                    {/* Mensajes */}
                    {message && (
                        <p className="text-center text-green-400 font-semibold text-sm">{message}</p>
                    )}
                    {error && (
                        <p className="text-center text-red-400 font-semibold text-sm">{error}</p>
                    )}
                </form>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
