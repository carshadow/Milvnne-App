import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/authContext';  // Import your AuthContext
import { motion } from 'framer-motion';
import { CartContext } from '../context/CartContext';
import { useLocation } from 'react-router-dom';

import { FaHome, FaShoppingCart, FaUser, FaSignInAlt, FaSignOutAlt, FaRegAddressCard, FaBoxOpen, FaShoppingBag } from 'react-icons/fa';  // Importing specific icons from react-icons

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { getCartItemCount } = useContext(CartContext);
    const location = useLocation();
    const isAdminPage = location.pathname.startsWith("/admin");

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50); // Cambia cuando scroll > 50px
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);


    return (

        <nav
            className={`fixed w-full z-50 p-4 transition-all duration-300 ${isAdminPage
                ? "bg-zinc-900 text-white shadow-md"
                : isScrolled
                    ? "bg-white text-black shadow-md"
                    : "bg-transparent text-white"
                }`}
        >
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 font-extrabold text-xl tracking-wide">
                    <span className="text-fuchsia-500">MILVNNE</span>
                    <img
                        src="/images/logo2unscreen.gif"
                        alt="Logo"
                        className="w-10 h-10 object-contain transition-transform duration-300 hover:scale-105"
                    />
                    <span className="text-fuchsia-500">STUDIOS</span>
                </Link>

                {/* Desktop Navigation */}
                <ul className="hidden md:flex space-x-6 items-center text-sm font-medium">
                    <li>
                        <Link
                            to="/"
                            onClick={() => window.scrollTo(0, 0)}
                            className="flex items-center gap-2 hover:text-fuchsia-500 transition-colors"
                        >
                            <FaShoppingBag className="text-xl" />
                            <span>Shop</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/products"
                            onClick={() => window.scrollTo(0, 0)}
                            className="flex items-center gap-2 hover:text-fuchsia-500 transition-colors"
                        >
                            <FaHome className="text-xl" />
                            <span>About</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/cart"
                            onClick={() => window.scrollTo(0, 0)}
                            className="relative flex items-center gap-2 hover:text-fuchsia-500 transition-colors"
                        >
                            <div className="relative">
                                <FaShoppingCart className="text-xl" />
                                {getCartItemCount() > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                        {getCartItemCount()}
                                    </span>
                                )}
                            </div>
                            <span>Cart</span>
                        </Link>
                    </li>

                    {!user ? (
                        <>
                            <li>
                                <Link
                                    to="/login"
                                    onClick={() => window.scrollTo(0, 0)}
                                    className="flex items-center gap-2 hover:text-fuchsia-500 transition-colors"
                                >
                                    <FaSignInAlt className="text-xl" />
                                    <span>Login</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/register"
                                    onClick={() => window.scrollTo(0, 0)}
                                    className="flex items-center gap-2 hover:text-fuchsia-500 transition-colors"
                                >
                                    <FaRegAddressCard className="text-xl" />
                                    <span>Register</span>
                                </Link>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link
                                    to="/profile"
                                    onClick={() => window.scrollTo(0, 0)}
                                    className="flex items-center gap-2 hover:text-fuchsia-500 transition-colors"
                                >
                                    <FaUser className="text-xl" />
                                    <span>Profile</span>
                                </Link>
                            </li>
                            {user.isAdmin && (
                                <li>
                                    <Link
                                        to="/admin"
                                        onClick={() => window.scrollTo(0, 0)}
                                        className="flex items-center gap-2 hover:text-fuchsia-500 transition-colors"
                                    >
                                        <FaBoxOpen className="text-xl" />
                                        <span>Admin</span>
                                    </Link>
                                </li>
                            )}
                            <li>
                                <button
                                    onClick={logout}
                                    className="flex items-center gap-2 hover:text-fuchsia-500 transition-colors"
                                >
                                    <FaSignOutAlt className="text-xl" />
                                    <span>Logout</span>
                                </button>
                            </li>
                        </>
                    )}
                </ul>

                {/* Mobile Hamburger Menu */}
                <div className="md:hidden">
                    <button onClick={toggleMenu} className="text-fuchsia-500">
                        {isMenuOpen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <motion.div
                className={`fixed top-0 left-0 h-full w-full z-50 bg-gradient-to-br from-black via-zinc-900 to-zinc-800 backdrop-blur-md border-l border-zinc-700 shadow-lg transition-transform duration-500 ${isMenuOpen ? "translate-x-0" : "translate-x-full"
                    }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: isMenuOpen ? 1 : 0 }}
                transition={{ duration: 0.4 }}
            >
                {/* Botón cerrar */}
                <div className="absolute top-4 right-4">
                    <button onClick={toggleMenu} className="text-white hover:text-fuchsia-400 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Menú de navegación */}
                <ul className="flex flex-col justify-center items-center h-full gap-6 text-lg font-semibold tracking-wide text-gray-200">
                    <li>
                        <Link to="/" onClick={() => { setIsMenuOpen(false); window.scrollTo(0, 0); }} className="hover:text-fuchsia-400 transition-all flex items-center gap-2">
                            <FaShoppingBag className="text-xl text-fuchsia-400" />
                            <span>Shop</span>
                        </Link>
                    </li>

                    <li>
                        <Link to="/products" onClick={() => { setIsMenuOpen(false); window.scrollTo(0, 0); }} className="hover:text-fuchsia-400 transition-all flex items-center gap-2">
                            <FaHome className="text-xl text-fuchsia-400" />
                            <span>About Us</span>
                        </Link>
                    </li>

                    <li>
                        <Link to="/cart" onClick={() => { setIsMenuOpen(false); window.scrollTo(0, 0); }} className="hover:text-fuchsia-400 transition-all flex items-center gap-2 relative">
                            <FaShoppingCart className="text-xl text-fuchsia-400" />
                            <span>Cart</span>
                            {getCartItemCount() > 0 && (
                                <span className="absolute -top-3 -right-4 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                                    {getCartItemCount()}
                                </span>
                            )}
                        </Link>
                    </li>

                    {!user ? (
                        <>
                            <li>
                                <Link to="/login" onClick={() => { setIsMenuOpen(false); window.scrollTo(0, 0); }} className="hover:text-fuchsia-400 transition-all flex items-center gap-2">
                                    <FaSignInAlt className="text-xl text-fuchsia-400" />
                                    <span>Login</span>
                                </Link>
                            </li>
                            <li>
                                <Link to="/register" onClick={() => { setIsMenuOpen(false); window.scrollTo(0, 0); }} className="hover:text-fuchsia-400 transition-all flex items-center gap-2">
                                    <FaRegAddressCard className="text-xl text-fuchsia-400" />
                                    <span>Register</span>
                                </Link>
                            </li>
                        </>
                    ) : (
                        <>
                            <li>
                                <Link to="/profile" onClick={() => { setIsMenuOpen(false); window.scrollTo(0, 0); }} className="hover:text-fuchsia-400 transition-all flex items-center gap-2">
                                    <FaUser className="text-xl text-fuchsia-400" />
                                    <span>Profile</span>
                                </Link>
                            </li>
                            {user.isAdmin && (
                                <li>
                                    <Link to="/admin" onClick={() => { setIsMenuOpen(false); window.scrollTo(0, 0); }} className="hover:text-fuchsia-400 transition-all flex items-center gap-2">
                                        <FaBoxOpen className="text-xl text-fuchsia-400" />
                                        <span>Admin</span>
                                    </Link>
                                </li>
                            )}
                            <li>
                                <button
                                    onClick={() => {
                                        logout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="hover:text-fuchsia-400 transition-all flex items-center gap-2"
                                >
                                    <FaSignOutAlt className="text-xl text-fuchsia-400" />
                                    <span>Logout</span>
                                </button>
                            </li>
                        </>
                    )}
                </ul>
            </motion.div>


        </nav>
    );
};

export default Navbar;
