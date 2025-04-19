import React, { useState, useEffect, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { motion } from "framer-motion";

const ProductDetail = () => {
    const { id } = useParams();
    const { addToCart } = useContext(CartContext);
    const [product, setProduct] = useState(null);
    const [selectedSize, setSelectedSize] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch(`http://localhost:8080/api/products/${id}`)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP Error! Status: ${res.status}`);
                return res.json();
            })
            .then((data) => {
                setProduct(data);
                setSelectedImage(data.coverImage);
                setLoading(false);
            })
            .catch((error) => {
                setError(error.message);
                setLoading(false);
            });
    }, [id]);

    const handleAddToCart = () => {
        if (product.hasSizes) {
            if (!selectedSize) return alert("Selecciona una talla");
            const stock = product.sizes[selectedSize];
            if (quantity > stock) {
                return alert(`Solo hay ${stock} disponibles para la talla ${selectedSize}`);
            }
            addToCart(product._id, quantity, selectedSize);
        } else {
            if (quantity > product.stock) {
                return alert(`Solo hay ${product.stock} unidades disponibles`);
            }
            addToCart(product._id, quantity, "general");
        }
        alert("Producto añadido al carrito");
    };

    if (loading) return <p className="text-center text-gray-400 pt-24">Cargando producto...</p>;
    if (error) return <p className="text-center text-red-500 pt-24">{error}</p>;

    return (
        <div className="min-h-screen pt-28 px-6 pb-20 bg-gradient-to-b from-black via-zinc-900 to-slate-300 text-white">
            <Link to="/" className="text-fuchsia-400 hover:underline text-sm mb-6 inline-block">
                ← Volver a la tienda
            </Link>

            <div className="flex flex-col md:flex-row gap-10 max-w-6xl mx-auto">
                {/* Galería de imágenes */}
                <div className="w-full md:w-1/2 space-y-6">
                    <div className="bg-zinc-800 rounded-xl overflow-hidden shadow-lg">
                        <img
                            src={selectedImage}
                            alt="Producto"
                            className="w-full object-cover rounded-xl"
                        />
                    </div>
                    <div className="flex gap-4 overflow-x-auto">
                        {[product.coverImage, product.hoverImage, ...product.images].map((img, index) => (
                            <img
                                key={index}
                                src={img}
                                alt={`Miniatura ${index + 1}`}
                                className={`w-16 h-16 object-cover rounded-lg border-2 cursor-pointer 
                                    ${selectedImage === img ? "border-fuchsia-500" : "border-transparent"} 
                                    hover:opacity-80 transition`}
                                onClick={() => setSelectedImage(img)}
                            />
                        ))}
                    </div>
                </div>

                {/* Información del producto */}
                <div className="w-full md:w-1/2 space-y-8">
                    <h2 className="text-4xl font-extrabold text-fuchsia-400">{product.name}</h2>
                    <div className="flex items-baseline gap-4 mt-2">
                        {product.discount > 0 && product.originalPrice ? (
                            <>
                                <p className="text-xl text-gray-400 line-through">
                                    ${parseFloat(product.originalPrice).toFixed(2)}
                                </p>
                                <p className="text-2xl font-bold text-pink-400">
                                    ${parseFloat(product.price).toFixed(2)}
                                </p>
                                <span className="ml-2 bg-fuchsia-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
                                    -{product.discount}%
                                </span>
                            </>
                        ) : (
                            <p className="text-2xl font-bold text-white">${parseFloat(product.price).toFixed(2)}</p>
                        )}
                    </div>



                    <p className="text-base text-gray-300 leading-relaxed bg-zinc-800 p-4 rounded-lg shadow">
                        {product.description}
                    </p>

                    {product.hasSizes ? (
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-2">Selecciona una talla:</h3>
                            <div className="flex gap-3 flex-wrap">
                                {["S", "M", "L", "XL"].map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={`px-4 py-2 rounded-full font-medium border transition-all
                                            ${selectedSize === size ? "bg-fuchsia-500 text-white" : "bg-zinc-800 text-gray-300"}
                                            ${product.sizes[size] === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-fuchsia-600"}`}
                                        disabled={product.sizes[size] === 0}
                                    >
                                        {size} {product.sizes[size] === 0 ? "Agotado" : ""}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-300">
                            Unidades disponibles:{" "}
                            <span className="font-semibold text-white">{product.stock}</span>
                        </p>
                    )}

                    <div className="flex items-center gap-4">
                        <label htmlFor="quantity" className="font-medium">Cantidad:</label>
                        <input
                            id="quantity"
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                            className="w-20 text-center py-2 rounded-md bg-zinc-700 text-white border border-zinc-600"
                        />
                    </div>

                    <button
                        onClick={handleAddToCart}
                        disabled={
                            product.hasSizes
                                ? !selectedSize || product.sizes[selectedSize] === 0
                                : product.stock === 0
                        }
                        className="w-full sm:w-auto px-6 py-3 bg-fuchsia-600 text-white rounded-lg font-bold hover:bg-fuchsia-700 transition disabled:opacity-40"
                    >
                        Añadir al carrito
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;


