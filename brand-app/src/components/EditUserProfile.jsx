import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/authContext';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const EditUserProfile = () => {
    const { user, updateUser } = useContext(AuthContext);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false); // 👈 Estado para mostrar/ocultar

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const res = await updateUser({ name, email, password });
        setMessage(res?.message || 'Perfil actualizado');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-slate-900 px-4">
            <motion.div
                className="w-full max-w-md bg-zinc-900 text-white p-8 rounded-2xl shadow-2xl border border-zinc-700"
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <h1 className="text-3xl font-extrabold text-center mb-6 text-fuchsia-400 tracking-wider">
                    Editar Perfil
                </h1>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="relative">
                        <FaUser className="absolute left-4 top-3.5 text-fuchsia-400" />
                        <input
                            type="text"
                            placeholder="Nombre"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg pl-12 py-3 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 placeholder-zinc-400"
                        />
                    </div>

                    <div className="relative">
                        <FaEnvelope className="absolute left-4 top-3.5 text-fuchsia-400" />
                        <input
                            type="email"
                            placeholder="Correo electrónico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg pl-12 py-3 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 placeholder-zinc-400"
                        />
                    </div>

                    <div className="relative">
                        <FaLock className="absolute left-4 top-3.5 text-fuchsia-400" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Nueva contraseña (opcional)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-zinc-800 text-white border border-zinc-700 rounded-lg pl-12 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-fuchsia-500 placeholder-zinc-400"
                        />
                        <div
                            className="absolute right-4 top-3.5 text-zinc-400 hover:text-fuchsia-400 cursor-pointer"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 transition-all text-white font-bold py-3 rounded-lg shadow-lg tracking-wide uppercase"
                    >
                        Guardar Cambios
                    </button>

                    {message && (
                        <p className="text-center text-green-400 mt-4 font-medium">{message}</p>
                    )}
                </form>
            </motion.div>
        </div>
    );
};

export default EditUserProfile;
