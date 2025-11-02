import React, { useState, useContext } from "react";
import { AuthContext } from "../context/authContext";
import { motion } from "framer-motion";
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link } from "react-router-dom";
import { z } from "zod";


const loginSchema = z.object({
    email: z.string().email("Debe ser un email válido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const LoginPage = () => {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage("");
        setFieldErrors({});

        const validation = loginSchema.safeParse({ email, password });

        if (!validation.success) {
            const newErrors = {};
            validation.error.errors.forEach(err => {
                newErrors[err.path[0]] = err.message;
            });
            setFieldErrors(newErrors);
            setLoading(false);
            return;
        }

        try {
            const success = await login(email, password); // 🔥 SIN pedir csrfToken
            if (success) {
                window.location.href = "/";
            } else {
                setErrorMessage("Correo electrónico o contraseña incorrectos.");
            }
        } catch (error) {
            setErrorMessage("Error al intentar iniciar sesión.");
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0b] bg-[radial-gradient(70%_90%_at_50%_10%,rgba(217,70,239,0.12),transparent_70%),radial-gradient(40%_60%_at_80%_0%,rgba(139,92,246,0.15),transparent_80%)] px-4">
            <motion.div
                initial={{ opacity: 0, y: 14, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full max-w-md relative"
            >
                {/* Glow border */}
                <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-br from-fuchsia-500/60 via-violet-500/20 to-transparent blur-[8px] opacity-70" />

                {/* Card */}
                <div className="relative rounded-3xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl shadow-[0_10px_50px_-15px_rgba(217,70,239,0.35)] p-6 sm:p-8">

                    {/* Header */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="h-12 w-12 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-300 text-xl font-black mb-2">
                            M
                        </div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-center text-white">
                            Welcome Back
                        </h1>
                        <p className="text-sm text-zinc-400 text-center">
                            Log in to your <span className="text-fuchsia-400 font-semibold">MILVNNE</span> account
                        </p>
                    </div>

                    {/* FORM */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email */}
                        <div className="relative">
                            <input
                                type="email"
                                id="email"
                                placeholder=" "
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`peer w-full rounded-xl bg-zinc-900/70 border ${fieldErrors.email ? "border-red-500/70" : "border-zinc-700/70"} px-4 pt-5 pb-2 text-white placeholder-transparent outline-none focus:ring-4 focus:ring-fuchsia-500/20 focus:border-fuchsia-500/70 transition`}
                            />
                            <label
                                htmlFor="email"
                                className="pointer-events-none absolute left-4 top-3 text-zinc-400 text-sm transition-all
              peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-500
              peer-focus:top-2 peer-focus:text-xs peer-focus:text-fuchsia-300"
                            >
                                Email
                            </label>
                            <FaUser className="absolute right-4 top-3.5 text-zinc-500 peer-focus:text-fuchsia-400 transition" />
                            {fieldErrors.email && (
                                <p className="text-red-400 text-xs mt-1 ml-1">{fieldErrors.email}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                id="password"
                                placeholder=" "
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`peer w-full rounded-xl bg-zinc-900/70 border ${fieldErrors.password ? "border-red-500/70" : "border-zinc-700/70"} px-4 pr-12 pt-5 pb-2 text-white placeholder-transparent outline-none focus:ring-4 focus:ring-fuchsia-500/20 focus:border-fuchsia-500/70 transition`}
                            />
                            <label
                                htmlFor="password"
                                className="pointer-events-none absolute left-4 top-3 text-zinc-400 text-sm transition-all
              peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-zinc-500
              peer-focus:top-2 peer-focus:text-xs peer-focus:text-fuchsia-300"
                            >
                                Password
                            </label>
                            <FaLock className="absolute right-10 top-3.5 text-zinc-500 peer-focus:text-fuchsia-400 transition" />
                            <button
                                type="button"
                                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-2.5 h-8 w-8 grid place-items-center text-zinc-400 hover:text-fuchsia-400 transition"
                            >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </button>
                            {fieldErrors.password && (
                                <p className="text-red-400 text-xs mt-1 ml-1">{fieldErrors.password}</p>
                            )}
                        </div>

                        {/* Forgot password */}
                        <div className="text-right text-sm">
                            <Link to="/forgot-password" className="text-fuchsia-300 hover:text-fuchsia-200 hover:underline">
                                ¿Olvidaste tu contraseña?
                            </Link>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full relative overflow-hidden rounded-xl px-5 py-3 font-semibold uppercase tracking-wide text-white bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-[0_10px_30px_-10px_rgba(217,70,239,0.45)]"
                        >
                            <span className="relative z-10">{loading ? "Entrando..." : "Login"}</span>
                            <span className="absolute inset-0 opacity-0 hover:opacity-20 transition bg-white" />
                        </button>

                        {/* Error general */}
                        {errorMessage && (
                            <p className="text-center text-red-400 font-medium mt-1">{errorMessage}</p>
                        )}
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-6">
                        <div className="flex-1 h-px bg-zinc-800" />
                        <span>o</span>
                        <div className="flex-1 h-px bg-zinc-800" />
                    </div>

                    {/* Register */}
                    <Link
                        to="/register"
                        className="block w-full text-center mt-4 rounded-xl border border-zinc-700/70 bg-zinc-900/40 hover:bg-zinc-800/60 text-zinc-200 py-3 transition"
                    >
                        Crear cuenta nueva
                    </Link>
                </div>
            </motion.div>
        </div>


    );
};

export default LoginPage;
