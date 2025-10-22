import React, { createContext, useState, useEffect, useContext, useMemo } from "react";
import { AuthContext } from "../context/authContext";

export const CartContext = createContext();

const keyFor = (user) => (user && user._id ? `cart_${user._id}` : "cart_guest");

export const CartProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const cartKey = useMemo(() => keyFor(user), [user]);

    const [cart, setCart] = useState([]);
    const [loading] = useState(false);
    const [error] = useState(null);

    // 1) Restaurar carrito según el usuario actual (o invitado)
    useEffect(() => {
        const raw = localStorage.getItem(cartKey);
        setCart(raw ? JSON.parse(raw) : []);
    }, [cartKey]);

    // 2) Persistir SIEMPRE en la misma llave (nunca "cart" genérico)
    useEffect(() => {
        if (Array.isArray(cart)) {
            localStorage.setItem(cartKey, JSON.stringify(cart));
        }
    }, [cart, cartKey]);

    // 3) (Opcional pero recomendado) Al volver del éxito de pago, limpiar carrito
    useEffect(() => {
        const path = window.location.pathname;
        const qs = new URLSearchParams(window.location.search);
        const isSuccess =
            path.includes("/checkout/success") ||
            qs.get("payment") === "success" ||
            qs.get("redirect_status") === "succeeded";

        if (!isSuccess) return;

        // Limpia front
        clearCart();

        // Limpia flag si lo usaste
        localStorage.removeItem("checkoutInProgress");

        // Limpia en BD (si está logueado)
        const token = localStorage.getItem("token");
        if (token) {
            fetch("https://clothing-backend.fly.dev/api/cart/clear", {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            }).catch(() => { });
        }
    }, [cartKey]);

    // --------- acciones ----------
    const addToCart = async (productId, quantity, size) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("https://clothing-backend.fly.dev/api/cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: JSON.stringify({ productId, quantity, size }),
            });

            const data = await res.json();
            if (res.ok) {
                setCart((prev) => [...prev, data.cartItem]);
            } else {
                console.error("Error adding product to cart:", data.message);
            }
        } catch (error) {
            console.error("Error adding product to cart:", error);
        }
    };

    const removeFromCart = async (cartItemId) => {
        try {
            const token = localStorage.getItem("token");

            if (token) {
                const response = await fetch(`https://clothing-backend.fly.dev/api/cart/${cartItemId}`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (!response.ok) {
                    const data = await response.json();
                    console.error("Error al eliminar producto:", data.message);
                    return;
                }
            }

            setCart((prev) => prev.filter((item) => item._id !== cartItemId));
        } catch (error) {
            console.error("Error eliminando producto del carrito:", error);
        }
    };

    const getCartItemCount = () => cart.reduce((total, item) => total + item.quantity, 0);

    const clearCart = () => {
        setCart([]);
        // si hay user, limpia su key; si no, limpia guest
        if (user && user._id) {
            localStorage.removeItem(`cart_${user._id}`);
        } else {
            localStorage.removeItem("cart_guest");
        }
        // por si quedó basura antigua:
        localStorage.removeItem("cart");
    };

    const updateQuantity = (itemId, newQuantity) => {
        setCart((prevCart) =>
            prevCart.map((item) =>
                item._id === itemId
                    ? { ...item, quantity: newQuantity > 0 ? newQuantity : 1 }
                    : item
            )
        );
    };

    return (
        <CartContext.Provider
            value={{ cart, addToCart, removeFromCart, getCartItemCount, clearCart, updateQuantity, loading, error }}
        >
            {children}
        </CartContext.Provider>
    );
};
