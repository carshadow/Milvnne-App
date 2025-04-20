import React, { useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import { CartContext } from "../context/CartContext";

const SuccessPage = () => {
    const { clearCart } = useContext(CartContext);

    useEffect(() => {
        if (localStorage.getItem("checkoutInProgress")) {
            clearCart();
            localStorage.removeItem("checkoutInProgress");
        }
    }, [clearCart]);

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-zinc-900 text-white flex items-center justify-center px-6 py-16">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-10 max-w-xl w-full text-center">
                <FaCheckCircle className="text-green-400 text-7xl mb-4 mx-auto animate-pulse" />

                <h1 className="text-4xl font-bold text-fuchsia-400 mb-3 uppercase tracking-wide">
                    ¡Gracias por tu compra!
                </h1>

                <p className="text-zinc-300 text-base leading-relaxed mb-6">
                    Tu orden fue procesada exitosamente. Te enviaremos un correo con los detalles.
                </p>

                <div className="bg-fuchsia-950/30 text-fuchsia-200 p-4 rounded-xl border border-fuchsia-600 mb-6">
                    <p className="text-sm font-medium">
                        🕒 Los pedidos se envían todos los <strong className="text-white">Jueves</strong>.
                        Prepárate para recibir tu merch pronto. 💖
                    </p>
                </div>

                <Link
                    to="/"
                    className="inline-block mt-4 bg-fuchsia-600 hover:bg-fuchsia-700 transition-all text-white font-bold py-3 px-8 rounded-full shadow-lg text-sm uppercase tracking-wider"
                >
                    ⬅️ Seguir comprando
                </Link>
            </div>
        </div>
    );
};

export default SuccessPage;
