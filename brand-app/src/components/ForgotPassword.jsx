import React, { useState } from "react";
import { motion } from "framer-motion";

const ForgotPassword = () => {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus("Enviando...");
        setError("");

        try {
            //  Primero obtenemos el CSRF token
            const csrfRes = await fetch("https://clothing-backend.fly.dev/api/csrf-token", {
                credentials: "include",
            });
            const csrfData = await csrfRes.json();
            const csrfToken = csrfData.csrfToken;

            // Ahora enviamos la solicitud protegida
            const res = await fetch("https://clothing-backend.fly.dev/api/users/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "CSRF-Token": csrfToken, // 👈🏻 Aquí pasamos el token
                },
                body: JSON.stringify({ email }),
                credentials: "include",
            });

            const data = await res.json();
            if (res.ok) {
                setStatus("✅ Revisa tu correo para cambiar tu contraseña.");
            } else {
                setError(data.message || "Hubo un error");
                setStatus("");
            }
        } catch (err) {
            setError("❌ Error al enviar solicitud");
            setStatus("");
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
                <h1 className="text-3xl font-bold text-center mb-6 text-fuchsia-400">¿Olvidaste tu contraseña?</h1>
                <p className="text-center text-sm text-zinc-400 mb-6">
                    Ingresa tu email y te enviaremos un enlace para cambiar tu contraseña.
                </p>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <input
                        type="email"
                        placeholder="Correo electrónico"
                        className="w-full p-3 rounded bg-zinc-800 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <button
                        type="submit"
                        className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-bold py-3 rounded-lg shadow-lg uppercase"
                    >
                        Enviar enlace
                    </button>

                    {/* Mensajes de estado */}
                    {status && (
                        <p className="text-center text-green-400 font-semibold text-sm">{status}</p>
                    )}
                    {error && (
                        <p className="text-center text-red-400 font-semibold text-sm">{error}</p>
                    )}
                </form>
            </motion.div>
        </div>
    );
};

export default ForgotPassword;
