import React, { useState, useContext, useEffect, useMemo } from "react";
import { AuthContext } from "../context/authContext";
import { motion } from "framer-motion";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaCheckCircle } from "react-icons/fa";

const EditUserProfile = () => {
    const { user, updateUser } = useContext(AuthContext);

    // Estado UI / formulario
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setEmail(user.email || "");
        }
    }, [user]);

    const initials = useMemo(() => {
        const n = (user?.name || "").trim();
        if (!n) return "U";
        const parts = n.split(" ").filter(Boolean);
        const first = parts[0]?.[0] || "U";
        const last = parts[parts.length - 1]?.[0] || "";
        return (first + last).toUpperCase();
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setSuccessMessage("");
        setSaving(true);

        try {
            const data = await updateUser({ name, email, password });
            if (data?.success) {
                setSuccessMessage(data.message || "Perfil actualizado correctamente");
                setPassword("");
            } else {
                if (data?.errors) {
                    const fieldErrors = {};
                    data.errors.forEach((err) => {
                        fieldErrors[err.path?.[0] || "general"] = err.message;
                    });
                    setErrors(fieldErrors);
                } else {
                    setErrors({ general: data?.message || "Error desconocido" });
                }
            }
        } catch (err) {
            console.error("Error actualizando perfil:", err);
            setErrors({ general: "Error de red o del servidor." });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 bg-[#0a0a0b] bg-[radial-gradient(70%_90%_at_50%_10%,rgba(217,70,239,0.10),transparent_70%),radial-gradient(40%_60%_at_80%_0%,rgba(139,92,246,0.12),transparent_80%)]">
            <motion.div
                className="w-full max-w-2xl relative"
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
            >
                {/* Glow */}
                <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-fuchsia-500/50 via-violet-500/20 to-transparent blur-[8px] opacity-70" />

                {/* Card */}
                <div className="relative rounded-3xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl shadow-[0_10px_50px_-15px_rgba(217,70,239,0.35)] overflow-hidden text-white">
                    {/* Header */}
                    <div className="flex items-center gap-4 p-6 border-b border-white/10">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-fuchsia-500/25 to-violet-500/20 border border-fuchsia-500/40 grid place-items-center text-fuchsia-200 font-bold">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Editar Perfil</h1>
                            <p className="text-xs text-zinc-400 truncate">
                                {user?.email || "Tu correo"} · Personaliza tu cuenta
                            </p>
                        </div>
                        {successMessage && (
                            <div className="ml-auto hidden sm:flex items-center gap-2 text-emerald-400 text-sm">
                                <FaCheckCircle />
                                <span className="truncate">{successMessage}</span>
                            </div>
                        )}
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
                        <div className="grid sm:grid-cols-2 gap-5">
                            {/* Nombre */}
                            <div className="relative">
                                <FaUser className="absolute left-4 top-3.5 text-fuchsia-400" />
                                <input
                                    id="name"
                                    type="text"
                                    placeholder=" "
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={`peer w-full rounded-xl bg-zinc-900/70 border px-12 pt-5 pb-2 outline-none transition
                    ${errors.name ? "border-red-500 focus:ring-4 focus:ring-red-500/20" : "border-zinc-700/70 focus:ring-4 focus:ring-fuchsia-500/20 focus:border-fuchsia-500/70"}`}
                                />
                                <label
                                    htmlFor="name"
                                    className="pointer-events-none absolute left-12 top-3 text-zinc-400 text-sm transition-all
                    peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-500
                    peer-focus:top-2 peer-focus:text-xs peer-focus:text-fuchsia-300"
                                >
                                    Nombre
                                </label>
                                {errors.name && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-red-400 text-xs mt-2"
                                    >
                                        {errors.name}
                                    </motion.div>
                                )}
                            </div>

                            {/* Email */}
                            <div className="relative">
                                <FaEnvelope className="absolute left-4 top-3.5 text-fuchsia-400" />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder=" "
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={`peer w-full rounded-xl bg-zinc-900/70 border px-12 pt-5 pb-2 outline-none transition
                    ${errors.email ? "border-red-500 focus:ring-4 focus:ring-red-500/20" : "border-zinc-700/70 focus:ring-4 focus:ring-fuchsia-500/20 focus:border-fuchsia-500/70"}`}
                                />
                                <label
                                    htmlFor="email"
                                    className="pointer-events-none absolute left-12 top-3 text-zinc-400 text-sm transition-all
                    peer-placeholder-shown:top-6 peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-500
                    peer-focus:top-2 peer-focus:text-xs peer-focus:text-fuchsia-300 "
                                >
                                    Correo electrónico
                                </label>
                                {errors.email && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-red-400 text-xs mt-2"
                                    >
                                        {errors.email}
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <FaLock className="absolute left-4 top-3.5 text-fuchsia-400" />
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder=" "
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`peer w-full rounded-xl bg-zinc-900/70 border pl-12 pr-12 pt-5 pb-2 outline-none transition
                  ${errors.password ? "border-red-500 focus:ring-4 focus:ring-red-500/20" : "border-zinc-700/70 focus:ring-4 focus:ring-fuchsia-500/20 focus:border-fuchsia-500/70"}`}
                            />
                            <label
                                htmlFor="password"
                                className="pointer-events-none absolute left-12 top-3 text-zinc-400 text-sm transition-all
                  peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-500
                  peer-focus:top-2 peer-focus:text-xs peer-focus:text-fuchsia-300"
                            >
                                Nueva contraseña (opcional)
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowPassword((s) => !s)}
                                className="absolute right-3 top-2.5 h-8 w-8 grid place-items-center text-zinc-400 hover:text-fuchsia-400 transition"
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                            {errors.password && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-red-400 text-xs mt-2"
                                >
                                    {errors.password}
                                </motion.div>
                            )}
                            <p className="text-[11px] text-zinc-500 mt-2">
                                Recomendado: 8+ caracteres, mayúscula, número y símbolo.
                            </p>
                        </div>

                        {/* Mensajes generales */}
                        {errors.general && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm px-4 py-3"
                            >
                                {errors.general}
                            </motion.div>
                        )}
                        {successMessage && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm px-4 py-3"
                            >
                                {successMessage}
                            </motion.div>
                        )}

                        {/* Botón */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="relative overflow-hidden rounded-xl px-6 py-3 font-semibold uppercase tracking-wide text-white bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-[0_10px_30px_-10px_rgba(217,70,239,0.45)]"
                            >
                                {saving ? "Guardando..." : "Guardar Cambios"}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default EditUserProfile;
