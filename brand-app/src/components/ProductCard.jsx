import React from "react";
import { Link } from "react-router-dom";

const ProductCard = ({ product }) => {
    return (
        <div className="group relative w-full h-64 overflow-hidden rounded-md">
            <Link to={`/product/${product._id}`} className="block w-full h-full">
                {/* Imagen de portada (coverImage) */}
                <img
                    src={`http://localhost:8080${product.coverImage}`}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover rounded-md transition-opacity duration-300 opacity-100 group-hover:opacity-0"
                />

                {/* Imagen al hacer hover (hoverImage) */}
                {product.hoverImage && (
                    <img
                        src={`http://localhost:8080${product.hoverImage}`}
                        alt={`${product.name} hover`}
                        className="absolute inset-0 w-full h-full object-cover rounded-md transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                    />
                )}

                {/* Información del producto */}
                <div className="absolute bottom-2 left-2 bg-white bg-opacity-75 px-3 py-1 rounded-md">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-gray-500">${product.price}</p>
                </div>
            </Link>
        </div>
    );
};

export default ProductCard;
