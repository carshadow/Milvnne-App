import React, { createContext, useState, useEffect } from "react";
import { useContext } from "react";
import { AuthContext } from "../context/authContext";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Restaurar carrito de localStorage al montar (antes de AuthContext estar listo)
    useEffect(() => {
        const restoreCartFromLocal = () => {
            const rawGuestCart = localStorage.getItem("cart_guest");
            const rawUserCart = user && user._id ? localStorage.getItem(`cart_${user._id}`) : null;

            const storedCart = rawUserCart || rawGuestCart;

            if (storedCart && storedCart !== "[]") {
                try {
                    const parsedCart = JSON.parse(storedCart);
                    if (Array.isArray(parsedCart)) {
                        setCart(parsedCart);
                    }
                } catch (e) {
                    console.error("Error parsing stored cart:", e);
                }
            }
        };

        restoreCartFromLocal();
    }, [user]);


    // Cargar carrito del localStorage cuando el user esté listo
    useEffect(() => {
        if (!user) return; // Espera a que AuthContext cargue el usuario

        const cartKey = user ? `cart_${user._id}` : "cart_guest";
        const storedCart = localStorage.getItem(cartKey);

        if (storedCart) {
            setCart(JSON.parse(storedCart));
        } else {
            setCart([]); // evita que quede undefined
        }
    }, [user]);

    // Guardar carrito en localStorage
    useEffect(() => {
        if (!user) return;
        const cartKey = `cart_${user._id}`;
        if (Array.isArray(cart)) {
            localStorage.setItem(cartKey, JSON.stringify(cart));
        }
    }, [cart, user]);


    // Cargar carrito desde la API si está autenticado
    useEffect(() => {
        const fetchCart = async () => {
            try {
                const fromCheckout = localStorage.getItem("checkoutInProgress");
                const isSuccessPage = window.location.pathname.includes("/success");

                // 🚫 Si viene del checkout y no es success, no hagas fetch
                if (fromCheckout && !isSuccessPage) {
                    console.log("⏪ Canceló el pago, no actualizamos el carrito.");
                    return;
                }

                const res = await fetch('https://clothing-backend.fly.dev/api/cart', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                });
                const data = await res.json();

                const validCartItems = data.filter(item => item.product !== null);
                setCart(validCartItems);
                localStorage.setItem('cart', JSON.stringify(validCartItems));
            } catch (error) {
                console.error("Error fetching cart:", error);
            }
        };

        if (user && user._id) {
            fetchCart();
        }
    }, [user]);



    // Function to add an item to the cart
    const addToCart = async (productId, quantity, size) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("https://clothing-backend.fly.dev/api/cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { "Authorization": `Bearer ${token}` }),
                },
                body: JSON.stringify({ productId, quantity, size }),
            });

            const data = await res.json();
            if (res.ok) {
                const updatedCart = [...cart, data.cartItem];
                setCart(updatedCart);
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
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    setCart(cart.filter(item => item._id !== cartItemId));
                } else {
                    const data = await response.json();
                    console.error("Error al eliminar producto:", data.message);
                }
            } else {
                const updatedCart = cart.filter(item => item._id !== cartItemId);
                setCart(updatedCart);
                if (user && user._id) {
                    localStorage.setItem(`cart_${user._id}`, JSON.stringify(updatedCart));
                }
            }
        } catch (error) {
            console.error("Error eliminando producto del carrito:", error);
        }
    };

    const getCartItemCount = () => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    };

    const clearCart = () => {
        setCart([]);
        if (user && user._id) {
            localStorage.removeItem(`cart_${user._id}`);
        }
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
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, getCartItemCount, clearCart, updateQuantity, loading, error }}>
            {children}
        </CartContext.Provider>
    );
};
