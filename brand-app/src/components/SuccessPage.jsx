import React, { useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import { CartContext } from "../context/CartContext";
const SuccessPage = () => {
    const { clearCart } = useContext(CartContext);

    useEffect(() => {
        if (localStorage.getItem("checkoutInProgress")) {
            clearCart();  // Vacía el carrito al cargar esta página
            localStorage.removeItem("checkoutInProgress"); // Borra la marca de checkout
        }
    }, [clearCart]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-6">
            <div className="bg-gray-900 p-8 rounded-lg shadow-lg text-center max-w-md w-full">
                <FaCheckCircle className="text-green-500 text-6xl mb-4 mx-auto" />
                <h1 className="text-3xl font-semibold mb-4">¡Pago Completado! 🎉</h1>
                <p className="text-gray-300 mb-6">
                    Gracias por tu compra. Tu pedido ha sido procesado con éxito.
                    Te enviaremos un correo con los detalles de tu compra.
                </p>

                <Link
                    to="/"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all"
                >
                    ⬅️ Continue Shopping
                </Link>
            </div>
        </div>
    );
};

export default SuccessPage;



