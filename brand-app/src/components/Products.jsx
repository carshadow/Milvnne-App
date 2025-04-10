import React, { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Products = () => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        fetch("http://localhost:8080/api/products")
            .then((res) => res.json())
            .then((data) => setProducts(data))
            .catch((error) => console.error("Error fetching products:", error));
    }, []);

    // return (
    //     <div className="p-6 min-h-screen bg-gradient-to-b from-black to-white"> {/* Full height with gradient */}
    //         {/* Hero Section with background image and gradient */}
    //         <motion.div
    //             initial={{ opacity: 0, scale: 0.9 }}
    //             animate={{ opacity: 1, scale: 1 }}
    //             transition={{ duration: 1 }}
    //             className="h-[500px] bg-cover bg-center relative flex items-center justify-center" // Adjust height for hero section
    //             style={{ backgroundImage: 'url("/images/Shop.png")' }}
    //         >
    //             <div className="absolute inset-0 bg-black bg-opacity-50"></div>
    //             <div className="relative text-center text-white">
    //                 <h1 className="text-4xl md:text-6xl font-bold">Bienvenidos a <span className="text-fuchsia-500">MILVN STUDIOS</span></h1>
    //             </div>
    //         </motion.div>

    //         <h1 className="text-4xl font-bold text-center mb-8 text-magenta-600">Milvnne Products</h1>

    //         {/* Product list */}
    //         <div className="flex overflow-x-auto space-x-6 pb-4">
    //             {products.map((product, index) => (
    //                 <motion.div
    //                     key={product._id}
    //                     initial={{ opacity: 0, y: 50 }}
    //                     whileInView={{ opacity: 1, y: 0 }}
    //                     transition={{ duration: 0.5, delay: index * 0.1 }}
    //                     viewport={{ once: true }}
    //                     className="group relative flex-shrink-0 w-64 h-80"
    //                 >
    //                     <Link to={`/product/${product._id}`} onClick={() => window.scrollTo(0, 0)}>
    //                         <ProductCard product={product} />
    //                     </Link>
    //                 </motion.div>
    //             ))}
    //         </div>
    //     </div>
    // );
};

export default Products;
