import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/authContext';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const EditUserProfile = () => {
    const { user, updateUser } = useContext(AuthContext);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setSuccessMessage('');

        try {
            const data = await updateUser({ name, email, password });

            if (data.success) { // ✅ Ahora sí correctamente
                setSuccessMessage(data.message || 'Perfil actualizado correctamente');
            } else {
                if (data.errors) {
                    const fieldErrors = {};
                    data.errors.forEach(err => {
                        fieldErrors[err.path[0]] = err.message;
                    });
                    setErrors(fieldErrors);
                } else {
                    setErrors({ general: data.message || 'Error desconocido' });
                }
            }
        } catch (err) {
            console.error('Error actualizando perfil:', err);
            setErrors({ general: 'Error de red o del servidor.' });
        }
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

                    {/* Nombre */}
                    <div className="relative">
                        <FaUser className="absolute left-4 top-3.5 text-fuchsia-400" />
                        <input
                            type="text"
                            placeholder="Nombre"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className={`w-full bg-zinc-800 text-white border ${errors.name ? 'border-red-500' : 'border-zinc-700'} rounded-lg pl-12 py-3 focus:outline-none focus:ring-2 ${errors.name ? 'focus:ring-red-500' : 'focus:ring-fuchsia-500'} placeholder-zinc-400`}
                        />
                        {errors.name && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-red-500/20 text-red-400 text-xs mt-2 py-1 px-3 rounded-full w-fit mx-auto"
                            >
                                {errors.name}
                            </motion.div>
                        )}

                    </div>

                    {/* Email */}
                    <div className="relative">
                        <FaEnvelope className="absolute left-4 top-3.5 text-fuchsia-400" />
                        <input
                            type="email"
                            placeholder="Correo electrónico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className={`w-full bg-zinc-800 text-white border ${errors.email ? 'border-red-500' : 'border-zinc-700'} rounded-lg pl-12 py-3 focus:outline-none focus:ring-2 ${errors.email ? 'focus:ring-red-500' : 'focus:ring-fuchsia-500'} placeholder-zinc-400`}
                        />
                        {errors.email && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-red-500/20 text-red-400 text-xs mt-2 py-1 px-3 rounded-full w-fit mx-auto"
                            >
                                {errors.email}
                            </motion.div>
                        )}
                    </div>

                    {/* Password */}
                    <div className="relative">
                        <motion.div
                            key={errors.password ? 'error' : 'noerror'}
                            animate={errors.password ? { x: [0, -8, 8, -8, 8, 0] } : { x: 0 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                        >
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Nueva contraseña (opcional)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full bg-zinc-800 text-white border ${errors.password ? 'border-red-500' : 'border-zinc-700'} rounded-lg pl-12 pr-10 py-3 focus:outline-none focus:ring-2 ${errors.password ? 'focus:ring-red-500' : 'focus:ring-fuchsia-500'} placeholder-zinc-400`}
                            />
                            {/* Ojo 👀 que el icono del ojo debe quedarse afuera */}
                        </motion.div>

                        <div
                            className="absolute right-4 top-3.5 text-zinc-400 hover:text-fuchsia-400 cursor-pointer"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </div>

                        {errors.password && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                className="bg-red-500/20 text-red-400 text-xs mt-2 py-1 px-3 rounded-full w-fit mx-auto"
                            >
                                {errors.password}
                            </motion.div>
                        )}
                    </div>



                    {/* Botón */}
                    <button
                        type="submit"
                        className="w-full bg-fuchsia-600 hover:bg-fuchsia-700 transition-all text-white font-bold py-3 rounded-lg shadow-lg tracking-wide uppercase"
                    >
                        Guardar Cambios
                    </button>

                    {/* Mensajes */}
                    {successMessage && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="bg-green-500/20 text-green-400 text-sm mt-4 py-2 px-4 rounded-full w-fit mx-auto shadow-md"
                        >
                            {successMessage}
                        </motion.div>
                    )}
                    {errors.general && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="bg-red-500/20 text-red-400 text-sm mt-6 py-2 px-4 rounded-full w-fit mx-auto shadow-md text-center"
                        >
                            {errors.general}
                        </motion.div>
                    )}
                </form>
            </motion.div>
        </div>
    );
};

export default EditUserProfile;
