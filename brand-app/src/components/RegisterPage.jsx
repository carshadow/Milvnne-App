import React, { useState } from "react";
import { motion } from "framer-motion";
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";
import { Link } from "react-router-dom";
import { z } from "zod";

const registerSchema = z.object({
    name: z.string().min(1, "El nombre es requerido"),
    email: z.string().email("Debe ser un email válido"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirma tu contraseña"),
}).refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
});

const RegisterPage = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});
    const [errorMessage, setErrorMessage] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setFieldErrors({});
        setErrorMessage("");

        const validation = registerSchema.safeParse({ name, email, password, confirmPassword });

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
            // 🔥 Pedir CSRF token
            const csrfRes = await fetch("https://clothing-backend.fly.dev/api/csrf-token", {
                credentials: "include",
            });
            const csrfData = await csrfRes.json();
            const csrfToken = csrfData.csrfToken;

            const user = { name, email, password };

            const response = await fetch("https://clothing-backend.fly.dev/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "CSRF-Token": csrfToken,
                },
                credentials: "include",
                body: JSON.stringify(user),
            });

            if (response.ok) {
                alert("✅ Registro exitoso");
                window.location.href = "/login";
            } else {
                const data = await response.json();
                setErrorMessage(data.message || "Error al registrarse");
            }
        } catch (error) {
            setErrorMessage("❌ Error al registrarse");
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
                <h1 className="text-3xl font-extrabold text-center mb-4 text-fuchsia-400 tracking-wide">
                    Create Account
                </h1>
                <p className="text-center text-zinc-400 mb-8">Join the MILVNNE movement</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <div className="relative">
                        <FaUser className="absolute left-4 top-3.5 text-fuchsia-400" />
                        <input
                            type="text"
                            placeholder="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`w-full bg-zinc-800 text-white border ${fieldErrors.name ? 'border-red-500' : 'border-zinc-700'} rounded-lg pl-12 py-3 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 placeholder-zinc-400`}
                        />
                        {fieldErrors.name && (
                            <p className="text-red-400 text-xs mt-1 ml-1">{fieldErrors.name}</p>
                        )}
                    </div>

                    {/* Email */}
                    <div className="relative">
                        <FaEnvelope className="absolute left-4 top-3.5 text-fuchsia-400" />
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

                    {/* Password */}
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

                    {/* Confirm Password */}
                    <div className="relative">
                        <FaLock className="absolute left-4 top-3.5 text-fuchsia-400" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full bg-zinc-800 text-white border ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-zinc-700'} rounded-lg pl-12 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 placeholder-zinc-400`}
                        />
                        <div
                            className="absolute right-4 top-3.5 cursor-pointer text-zinc-400 hover:text-fuchsia-500 transition"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </div>
                        {fieldErrors.confirmPassword && (
                            <p className="text-red-400 text-xs mt-1 ml-1">{fieldErrors.confirmPassword}</p>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 transition-all text-white font-bold py-3 rounded-lg shadow-lg tracking-wide uppercase"
                    >
                        {loading ? "Creating..." : "Register"}
                    </button>

                    {/* General register error */}
                    {errorMessage && (
                        <p className="text-center text-red-400 font-medium mt-2">
                            {errorMessage}
                        </p>
                    )}
                </form>

                <div className="text-center mt-6">
                    <p className="text-zinc-400">
                        Already have an account?{" "}
                        <Link to="/login" className="text-fuchsia-400 hover:underline font-semibold">
                            Sign In
                        </Link>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
