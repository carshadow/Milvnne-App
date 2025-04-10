import React from "react";

const ProductInfo = ({ product }) => {
    if (!product) {
        return <p className="text-red-500">⚠️ Error: No product data available.</p>;
    }

    // Calcula el stock total sumando los valores de los tamaños
    const totalStock = Object.values(product.sizes).reduce((acc, sizeStock) => acc + sizeStock, 0);
    const stockStatus = totalStock > 0 ? "Available" : "Unavailable"; // Determina el estado del stock

    return (
        <div className="p-6 bg-white shadow-md rounded-lg">
            <h1 className="text-3xl font-bold text-indigo-500">{product.name || "No Name Available"}</h1>
            <p className="text-gray-500 mt-2 text-lg">${product.price ? product.price.toFixed(2) : "N/A"}</p>
            <p className="text-gray-600 mt-4">{product.description || "No description available."}</p>

            {/* Información adicional */}
            <div className="mt-6">
                <p className="text-sm text-gray-500">Category: <span className="font-semibold">{product.category || "Unknown"}</span></p>
                <p className="text-sm text-gray-500">Stock: <span className="font-semibold">{stockStatus}</span></p> {/* Muestra "Available" o "Unavailable" */}
            </div>
        </div>
    );
};

export default ProductInfo;
