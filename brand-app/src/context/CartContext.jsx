import React, { createContext, useState, useEffect } from "react";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch cart items when the page loads (from localStorage or API)
    useEffect(() => {
        const storedCart = localStorage.getItem("cart");
        if (storedCart) {
            setCart(JSON.parse(storedCart));  // Initialize cart from localStorage
        }
    }, []);

    // Update localStorage whenever the cart changes
    useEffect(() => {
        if (cart.length > 0) {
            localStorage.setItem("cart", JSON.stringify(cart)); // Save to localStorage
        }
    }, [cart]);
    useEffect(() => {
        const fetchCart = async () => {
            try {
                const res = await fetch('http://localhost:8080/api/cart', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                });
                const data = await res.json();

                // Filtrar solo los productos válidos que existen en la base de datos
                const validCartItems = data.filter(item => item.product !== null);
                setCart(validCartItems);

                // Actualiza localStorage
                localStorage.setItem('cart', JSON.stringify(validCartItems));
            } catch (error) {
                console.error("Error fetching cart:", error);
            }
        };

        fetchCart();
    }, []);


    // Function to add an item to the cart
    const addToCart = async (productId, quantity, size) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:8080/api/cart", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token && { "Authorization": `Bearer ${token}` }),
                },
                body: JSON.stringify({ productId, quantity, size }), // Include size here
            });

            const data = await res.json();
            if (res.ok) {
                const updatedCart = [...cart, data.cartItem];
                setCart(updatedCart); // Update the cart in the state
            } else {
                console.error("Error adding product to cart:", data.message);
            }
        } catch (error) {
            console.error("Error adding product to cart:", error);
        }
    };

    // Function to remove an item from the cart
    const removeFromCart = async (cartItemId) => {
        try {
            const token = localStorage.getItem("token");

            if (token) {
                // Si el usuario está autenticado, eliminar desde la API
                const response = await fetch(`http://localhost:8080/api/cart/${cartItemId}`, {
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
                // Si el usuario NO está autenticado, eliminarlo solo del localStorage
                const updatedCart = cart.filter(item => item._id !== cartItemId);
                setCart(updatedCart);
                localStorage.setItem("cart", JSON.stringify(updatedCart));
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
        localStorage.removeItem("cart"); // Borra el carrito del almacenamiento local
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


    // const addToCart = (product, size) => {
    //     const existingItem = cart.find((item) => item.product._id === product._id && item.size === size);
    //     if (existingItem) {
    //         setCart(cart.map(item =>
    //             item.product._id === product._id && item.size === size
    //                 ? { ...item, quantity: item.quantity + 1 }
    //                 : item
    //         ));
    //     } else {
    //         setCart([...cart, { product, size, quantity: 1 }]);
    //     }
    // };



    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, addToCart, getCartItemCount, clearCart, updateQuantity, loading, error }}>
            {children}
        </CartContext.Provider>
    );
};
