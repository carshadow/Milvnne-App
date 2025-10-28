import React, { useState, useEffect, useContext, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaHome,
    FaShoppingCart,
    FaUser,
    FaSignInAlt,
    FaSignOutAlt,
    FaRegAddressCard,
    FaBoxOpen,
    FaShoppingBag,
} from "react-icons/fa";
import { AuthContext } from "../context/authContext";
import { CartContext } from "../context/CartContext";

const NavLink = ({ to, icon: Icon, children, isActive, onClick }) => {
    return (
        <Link
            to={to}
            onClick={onClick}
            className={`relative flex items-center gap-2 px-2 py-1.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 rounded-md
        ${isActive ? "text-fuchsia-600" : "hover:text-fuchsia-500"}
      `}
        >
            <Icon className="text-lg" />
            <span className="text-sm font-medium">{children}</span>
            <AnimatePresence>
                {isActive && (
                    <motion.span
                        layoutId="active-underline"
                        className="absolute -bottom-1 left-2 right-2 h-0.5 bg-fuchsia-600 rounded-full"
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: 1, scaleX: 1 }}
                        exit={{ opacity: 0, scaleX: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                )}
            </AnimatePresence>
        </Link>
    );
};

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const { getCartItemCount } = useContext(CartContext);
    const location = useLocation();

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    const isAdminPage = location.pathname.startsWith("/admin");
    const cartCount = getCartItemCount?.() || 0;

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 50);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Estilo del contenedor según ruta/scroll
    const shellClasses = useMemo(() => {
        if (isMenuOpen) {
            return "bg-zinc-900/95 text-white shadow-lg backdrop-blur supports-[backdrop-filter]:backdrop-blur";
        }
        if (isAdminPage) {
            return "bg-zinc-900/95 text-white shadow-lg backdrop-blur supports-[backdrop-filter]:backdrop-blur";
        }
        if (isScrolled) {
            return "bg-white/90 text-black shadow-md backdrop-blur supports-[backdrop-filter]:backdrop-blur";
        }
        return "bg-transparent text-white";
    }, [isMenuOpen, isScrolled, isAdminPage]);

    const linkIsActive = (path) => location.pathname === path;

    const handleCloseMenu = () => setIsMenuOpen(false);

    return (
        <nav className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${shellClasses}`}>
            {/* Top border gradient */}
            <div className="h-0.5 w-full bg-gradient-to-r from-fuchsia-600 via-pink-500 to-fuchsia-600 opacity-80" />

            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link
                        to="/"
                        onClick={() => window.scrollTo(0, 0)}
                        className="group flex items-center gap-2 font-extrabold text-lg tracking-wide"
                    >
                        <span className="text-fuchsia-600 group-hover:scale-[1.02] transition-transform">MILVNNE</span>
                        <img
                            src="/images/logo2unscreen.gif"
                            alt="Logo"
                            className="w-9 h-9 object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                        <span className="text-fuchsia-600 group-hover:scale-[1.02] transition-transform">STUDIOS</span>
                    </Link>

                    {/* Desktop Nav */}
                    <ul className="hidden md:flex items-center gap-4">
                        <li>
                            <NavLink
                                to="/"
                                icon={FaShoppingBag}
                                isActive={linkIsActive("/")}
                                onClick={() => window.scrollTo(0, 0)}
                            >
                                Shop
                            </NavLink>
                        </li>

                        <li>
                            <NavLink
                                to="/products"
                                icon={FaHome}
                                isActive={linkIsActive("/products")}
                                onClick={() => window.scrollTo(0, 0)}
                            >
                                About
                            </NavLink>
                        </li>

                        <li>
                            <Link
                                to="/cart"
                                onClick={() => window.scrollTo(0, 0)}
                                className={`relative flex items-center gap-2 px-2 py-1.5 transition-colors rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500
                  ${linkIsActive("/cart") ? "text-fuchsia-600" : "hover:text-fuchsia-500"}
                `}
                            >
                                <div className="relative">
                                    <FaShoppingCart className="text-lg" />
                                    <AnimatePresence>
                                        {cartCount > 0 && (
                                            <motion.span
                                                key="cart-badge"
                                                initial={{ scale: 0, opacity: 0, y: -6 }}
                                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                                exit={{ scale: 0, opacity: 0, y: -6 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold"
                                                aria-label={`${cartCount} items in cart`}
                                            >
                                                {cartCount}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <span className="text-sm font-medium">Cart</span>
                            </Link>
                        </li>

                        {!user ? (
                            <>
                                <li>
                                    <NavLink
                                        to="/login"
                                        icon={FaSignInAlt}
                                        isActive={linkIsActive("/login")}
                                        onClick={() => window.scrollTo(0, 0)}
                                    >
                                        Login
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink
                                        to="/register"
                                        icon={FaRegAddressCard}
                                        isActive={linkIsActive("/register")}
                                        onClick={() => window.scrollTo(0, 0)}
                                    >
                                        Register
                                    </NavLink>
                                </li>
                            </>
                        ) : (
                            <>
                                <li>
                                    <NavLink
                                        to="/profile"
                                        icon={FaUser}
                                        isActive={linkIsActive("/profile")}
                                        onClick={() => window.scrollTo(0, 0)}
                                    >
                                        Profile
                                    </NavLink>
                                </li>
                                {user.isAdmin && (
                                    <li>
                                        <NavLink
                                            to="/admin"
                                            icon={FaBoxOpen}
                                            isActive={linkIsActive("/admin")}
                                            onClick={() => window.scrollTo(0, 0)}
                                        >
                                            Admin
                                        </NavLink>
                                    </li>
                                )}
                                <li>
                                    <button
                                        onClick={logout}
                                        className="flex items-center gap-2 px-2 py-1.5 hover:text-fuchsia-500 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
                                    >
                                        <FaSignOutAlt className="text-lg" />
                                        <span className="text-sm font-medium">Logout</span>
                                    </button>
                                </li>
                            </>
                        )}
                    </ul>

                    {/* Mobile: Cart + Burger */}
                    <div className="md:hidden flex items-center gap-3">
                        <Link
                            to="/cart"
                            onClick={() => window.scrollTo(0, 0)}
                            className="relative p-2 rounded-md hover:text-fuchsia-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
                            aria-label="Open cart"
                        >
                            <FaShoppingCart className="text-xl" />
                            <AnimatePresence>
                                {cartCount > 0 && (
                                    <motion.span
                                        key="cart-badge-mobile"
                                        initial={{ scale: 0, opacity: 0, y: -6 }}
                                        animate={{ scale: 1, opacity: 1, y: 0 }}
                                        exit={{ scale: 0, opacity: 0, y: -6 }}
                                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold"
                                    >
                                        {cartCount}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>

                        <button
                            onClick={() => setIsMenuOpen((v) => !v)}
                            className="p-2 rounded-md text-fuchsia-600 hover:text-fuchsia-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
                            aria-label="Toggle menu"
                            aria-expanded={isMenuOpen}
                        >
                            {!isMenuOpen ? (
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            ) : (
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeWidth="2" strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        key="overlay"
                        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm md:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleCloseMenu}
                    />
                )}
            </AnimatePresence>

            {/* Mobile Sheet */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.aside
                        key="sheet"
                        className="fixed top-0 right-0 z-[70] h-full w-11/12 max-w-sm bg-zinc-900 bg-opacity-100 text-gray-200 border-l border-zinc-700 shadow-2xl md:hidden"


                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "tween", duration: 0.35 }}
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="flex items-center justify-between px-4 h-16 border-b border-zinc-700">
                            <div className="flex items-center gap-2 font-bold">
                                <span className="text-fuchsia-500">MILVNNE</span>
                                <img src="/images/logo2unscreen.gif" className="w-7 h-7" alt="Logo" />
                                <span className="text-fuchsia-500">STUDIOS</span>
                            </div>
                            <button
                                onClick={handleCloseMenu}
                                className="p-2 rounded-md hover:text-fuchsia-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
                                aria-label="Close menu"
                            >
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path strokeWidth="2" strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <ul className="flex flex-col gap-1 p-3">
                            <li>
                                <Link
                                    to="/"
                                    onClick={() => {
                                        handleCloseMenu();
                                        window.scrollTo(0, 0);
                                    }}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${linkIsActive("/") ? "bg-zinc-800 text-fuchsia-400" : "hover:bg-zinc-800"
                                        }`}
                                >
                                    <FaShoppingBag className="text-fuchsia-400" />
                                    <span>Shop</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/products"
                                    onClick={() => {
                                        handleCloseMenu();
                                        window.scrollTo(0, 0);
                                    }}
                                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${linkIsActive("/products") ? "bg-zinc-800 text-fuchsia-400" : "hover:bg-zinc-800"
                                        }`}
                                >
                                    <FaHome className="text-fuchsia-400" />
                                    <span>About Us</span>
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/cart"
                                    onClick={() => {
                                        handleCloseMenu();
                                        window.scrollTo(0, 0);
                                    }}
                                    className={`relative flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${linkIsActive("/cart") ? "bg-zinc-800 text-fuchsia-400" : "hover:bg-zinc-800"
                                        }`}
                                >
                                    <FaShoppingCart className="text-fuchsia-400" />
                                    <span>Cart</span>
                                    {cartCount > 0 && (
                                        <span className="ml-auto bg-red-500 text-white text-xs min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center font-bold">
                                            {cartCount}
                                        </span>
                                    )}
                                </Link>
                            </li>

                            {!user ? (
                                <>
                                    <li>
                                        <Link
                                            to="/login"
                                            onClick={() => {
                                                handleCloseMenu();
                                                window.scrollTo(0, 0);
                                            }}
                                            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${linkIsActive("/login") ? "bg-zinc-800 text-fuchsia-400" : "hover:bg-zinc-800"
                                                }`}
                                        >
                                            <FaSignInAlt className="text-fuchsia-400" />
                                            <span>Login</span>
                                        </Link>
                                    </li>
                                    <li>
                                        <Link
                                            to="/register"
                                            onClick={() => {
                                                handleCloseMenu();
                                                window.scrollTo(0, 0);
                                            }}
                                            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${linkIsActive("/register") ? "bg-zinc-800 text-fuchsia-400" : "hover:bg-zinc-800"
                                                }`}
                                        >
                                            <FaRegAddressCard className="text-fuchsia-400" />
                                            <span>Register</span>
                                        </Link>
                                    </li>
                                </>
                            ) : (
                                <>
                                    <li>
                                        <Link
                                            to="/profile"
                                            onClick={() => {
                                                handleCloseMenu();
                                                window.scrollTo(0, 0);
                                            }}
                                            className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${linkIsActive("/profile") ? "bg-zinc-800 text-fuchsia-400" : "hover:bg-zinc-800"
                                                }`}
                                        >
                                            <FaUser className="text-fuchsia-400" />
                                            <span>Profile</span>
                                        </Link>
                                    </li>
                                    {user.isAdmin && (
                                        <li>
                                            <Link
                                                to="/admin"
                                                onClick={() => {
                                                    handleCloseMenu();
                                                    window.scrollTo(0, 0);
                                                }}
                                                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${linkIsActive("/admin") ? "bg-zinc-800 text-fuchsia-400" : "hover:bg-zinc-800"
                                                    }`}
                                            >
                                                <FaBoxOpen className="text-fuchsia-400" />
                                                <span>Admin</span>
                                                <span className="ml-auto text-[10px] uppercase tracking-wider bg-emerald-600/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-600/40">
                                                    Admin
                                                </span>
                                            </Link>
                                        </li>
                                    )}
                                    <li>
                                        <button
                                            onClick={() => {
                                                logout();
                                                handleCloseMenu();
                                            }}
                                            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-zinc-800 transition-colors text-left"
                                        >
                                            <FaSignOutAlt className="text-fuchsia-400" />
                                            <span>Logout</span>
                                        </button>
                                    </li>
                                </>
                            )}
                        </ul>
                    </motion.aside>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default Navbar;
