import React, { useState, useEffect } from "react";
import ProductCard from "./ProductCard";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Products = () => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        fetch("https://clothing-backend.fly.dev/api/products")
            .then((res) => res.json())
            .then((data) => setProducts(data))
            .catch((error) => console.error("Error fetching products:", error));
    }, []);
};

export default Products;
