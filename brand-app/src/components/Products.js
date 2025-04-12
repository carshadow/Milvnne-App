import React, { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaSearch } from 'react-icons/fa';
import { debounce } from 'lodash';
import { useCallback } from 'react';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [categoryOrder, setCategoryOrder] = useState([]);
    const [categoryImages, setCategoryImages] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');



    // Fetch products
    useEffect(() => {
        fetch('http://localhost:8080/api/products')
            .then(res => res.json())
            .then(data => setProducts(data))
            .catch(err => console.error('Error fetching products:', err));
    }, []);

    // Fetch categories (order + image)
    useEffect(() => {
        fetch('http://localhost:8080/api/categories')
            .then(res => res.json())
            .then(data => {
                const order = data.map(c => c.name);
                const imageMap = {};
                data.forEach(c => {
                    imageMap[c.name] = `http://localhost:8080${c.imageUrl}`; // ✅ usa el campo correcto con ruta
                });
                setCategoryOrder(order);
                setCategoryImages(imageMap);
            })
            .catch(err => console.error('Error fetching categories:', err));
    }, []);

    const categoriesInProducts = [...new Set(products.map(p => p.category))];

    // Ordena basado en el orden guardado
    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
    const debounceSearch = useCallback(
        debounce((value) => {
            setDebouncedSearch(value);
        }, 500),
        []
    );

    // Actualiza el valor del input al escribir
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchQuery(value);      // se ve en UI
        debounceSearch(value);      // se usa para buscar
    };
    // Ordena basado en el orden guardado
    const groupedProducts = categoryOrder
        .map((category) => ({
            type: category,
            products: filteredProducts.filter((product) => product.category === category),
        }))
        .filter((group) => group.products.length > 0);

    // Añade categorías que no estén en el orden
    const remainingGroups = categoriesInProducts
        .filter((cat) => !categoryOrder.includes(cat))
        .map((type) => ({
            type,
            products: filteredProducts.filter((product) => product.category === type),
        }));

    groupedProducts.push(...remainingGroups);
    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-slate-400 text-white font-sans">
            {/* HERO SECTION */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1 }}
                className="relative h-screen w-full overflow-hidden"
            >
                {/* Imagen de fondo */}
                <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: 'url("/images/shop2.jpg")' }}
                />

                {/* Capa oscura y blur */}
                <div className="absolute inset-0 bg-black/60" />

                {/* Contenido */}
                <div className="relative z-10 flex flex-col items-center justify-center text-center h-full px-6">
                    <motion.h1
                        className="text-4xl sm:text-6xl md:text-7xl font-extrabold uppercase tracking-tight text-white leading-tight drop-shadow-xl"
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.3 }}
                    >
                        Bienvenidos a<br />
                        <span className="text-fuchsia-500">MILVNNE STUDIOS</span>
                    </motion.h1>

                    <motion.p
                        className="mt-6 text-lg sm:text-xl text-gray-300 max-w-xl"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.5 }}
                    >
                        Moda deportiva. Urbana. Sin límites. Encuentra tu próxima pieza favorita hoy.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.7 }}
                        className="mt-10"
                    >
                        {/* <Link
                            to="/products"
                            className="px-8 py-4 bg-fuchsia-500 text-white rounded-full text-lg font-bold shadow-lg hover:bg-fuchsia-600 transition-all"
                        >
                            Explorar Productos
                        </Link> */}
                    </motion.div>
                </div>
            </motion.div>

            <div className="px-6 md:px-16 mt-12">
                <div className="flex justify-center md:justify-end">
                    <div className="relative w-full md:w-1/2">
                        <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="w-full pl-12 pr-6 py-3 rounded-full bg-neutral-900 text-white placeholder-gray-400 border border-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 transition"
                        />
                    </div>
                </div>
            </div>


            {/* PRODUCTS SECTION */}
            <div className="px-6 md:px-16 py-16">
                <h2 className="text-4xl font-bold text-center text-fuchsia-500 mb-16 uppercase tracking-wider">
                    Productos
                </h2>

                {groupedProducts.map((group, index) => (
                    <React.Fragment key={group.type}>
                        {/* Imagen de fondo */}
                        {categoryImages[group.type] && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                transition={{ duration: 0.8 }}
                                className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] xl:h-[90vh] overflow-hidden rounded-xl shadow-2xl my-16"
                            >
                                <img
                                    src={categoryImages[group.type]}
                                    alt={`${group.type} Collection`}
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-center px-4 md:px-8">
                                    <h2 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-extrabold uppercase text-white drop-shadow-xl tracking-wide">
                                        {group.type}
                                        <span className="block text-fuchsia-400">Collection</span>
                                    </h2>
                                    {/* <p className="mt-3 text-base sm:text-lg md:text-xl text-neutral-300 max-w-2xl drop-shadow">
                                        Inspiración única para cada estilo.
                                    </p> */}
                                    {/* <button className="mt-6 px-6 py-3 bg-white text-black font-semibold rounded-full uppercase hover:bg-fuchsia-400 hover:text-white transition">
                                        Explorar
                                    </button> */}
                                </div>
                            </motion.div>

                        )}


                        {/* Productos de esa categoría */}
                        <div className="mb-24">
                            <motion.h3
                                initial={{ opacity: 0, x: -100 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6 }}
                                className="text-2xl md:text-3xl font-semibold uppercase text-white mb-4 tracking-widest"
                            >
                                {group.type}
                                <span className="block w-24 h-1 mt-2 bg-gradient-to-r from-fuchsia-600 to-pink-400 rounded-full" />
                            </motion.h3>

                            {/* Carrusel */}
                            <div className="flex overflow-x-auto gap-8 py-6 scroll-smooth scrollbar-thin scrollbar-thumb-fuchsia-500 scrollbar-track-transparent">
                                {group.products.map((product, i) => (
                                    <motion.div
                                        key={product._id}
                                        initial={{ opacity: 0, y: 50 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: i * 0.1 }}
                                        viewport={{ once: true }}
                                        className="flex-shrink-0 w-[280px] h-[460px] bg-neutral-800 rounded-xl overflow-hidden relative group shadow-lg hover:shadow-2xl transition duration-300"
                                    >
                                        <Link to={`/product/${product._id}`} onClick={() => window.scrollTo(0, 0)}>
                                            <img
                                                src={`http://localhost:8080${product.coverImage}`}
                                                alt={product.name}
                                                className="w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
                                            />
                                            <img
                                                className="absolute top-0 left-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
                                                src={`http://localhost:8080${product.hoverImage}`}
                                            />
                                            <div className="absolute bottom-4 left-4 right-4 z-20 bg-black/70 text-white p-4 rounded-lg shadow-md">
                                                <h4 className="font-bold text-lg truncate">{product.name}</h4>

                                                {product.discount > 0 ? (
                                                    <div className="mt-1">
                                                        <span className="text-xs bg-red-500 text-white font-semibold px-2 py-1 rounded-full mr-2">
                                                            -{product.discount}% OFF
                                                        </span>
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-sm line-through text-gray-400">${Number(product.originalPrice).toFixed(2)}</span>
                                                            <span className="text-pink-400 font-bold text-lg">${Number(product.price).toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-pink-300">${Number(product.price).toFixed(2)}</p>
                                                )}
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default Products;
