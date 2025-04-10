import React, { useState, useContext } from "react";
import { AuthContext } from "../context/authContext";
import { motion } from "framer-motion";
import { FaUser, FaLock } from "react-icons/fa";
import { Link } from "react-router-dom";
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginPage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
            window.location.href = "/";
        } catch (error) {
            alert("Error: " + error.message);
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
                            required
                            className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg pl-12 py-3 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 placeholder-zinc-400"
                        />
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                        <FaLock className="absolute left-4 top-3.5 text-fuchsia-400" />
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg pl-12 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 placeholder-zinc-400"
                        />
                        <div
                            className="absolute right-4 top-3.5 cursor-pointer text-zinc-400 hover:text-fuchsia-500 transition"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 transition-all text-white font-bold py-3 rounded-lg shadow-lg tracking-wide uppercase"
                    >
                        {loading ? "Entrando..." : "Login"}
                    </button>
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
