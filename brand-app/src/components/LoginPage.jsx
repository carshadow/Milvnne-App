import React, { useState, useContext } from "react";
import { AuthContext } from "../context/authContext";
import { motion } from "framer-motion";
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link } from "react-router-dom";
import { z } from "zod";

// ✅ Esquema de validación Zod
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
    const [fieldErrors, setFieldErrors] = useState({}); // 👈 Errores por campo

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage("");
        setFieldErrors({});

        // 🧠 Validar con Zod antes de enviar
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
            const success = await login(email, password);

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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-slate-800 px-4">
            <motion.div
                className="w-full max-w-md bg-zinc-900 text-white p-8 rounded-2xl shadow-2xl border border-zinc-700"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl font-extrabold text-center mb-4 text-fuchsia-400 tracking-wider">
                    WELCOME BACK
                </h1>
                <p className="text-center text-zinc-400 mb-8">Log in to your MILVNNE account</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email Input */}
                    <div className="relative">
                        <FaUser className="absolute left-4 top-3.5 text-fuchsia-400" />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full bg-zinc-800 text-white border ${fieldErrors.email ? 'border-red-500' : 'border-zinc-700'} rounded-lg pl-12 py-3 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 placeholder-zinc-400`}
                        />
                        {fieldErrors.email && (
                            <p className="text-red-400 text-xs mt-1 ml-1">{fieldErrors.email}</p>
                        )}
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                        <FaLock className="absolute left-4 top-3.5 text-fuchsia-400" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full bg-zinc-800 text-white border ${fieldErrors.password ? 'border-red-500' : 'border-zinc-700'} rounded-lg pl-12 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 placeholder-zinc-400`}
                        />
                        <div
                            className="absolute right-4 top-3.5 cursor-pointer text-zinc-400 hover:text-fuchsia-500 transition"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </div>
                        {fieldErrors.password && (
                            <p className="text-red-400 text-xs mt-1 ml-1">{fieldErrors.password}</p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 transition-all text-white font-bold py-3 rounded-lg shadow-lg tracking-wide uppercase"
                    >
                        {loading ? "Entrando..." : "Login"}
                    </button>

                    {/* General login error */}
                    {errorMessage && (
                        <p className="text-center text-red-400 font-medium mt-2">
                            {errorMessage}
                        </p>
                    )}

                    <div className="text-center mt-4">
                        <Link
                            to="/forgot-password"
                            className="text-sm text-fuchsia-400 hover:underline"
                        >
                            ¿Olvidaste tu contraseña?
                        </Link>
                    </div>
                </form>

                {/* Extra Actions */}
                <div className="text-center mt-6">
                    <p className="text-zinc-400">
                        Don't have an account?{" "}
                        <Link to="/register" className="text-fuchsia-400 hover:underline font-semibold">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
