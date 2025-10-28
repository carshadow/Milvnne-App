import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaSearch, FaFilter, FaSortAmountDown, FaTag } from 'react-icons/fa';
import { debounce } from 'lodash';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const Products = () => {
    const navigate = useNavigate();

    // Data
    const [products, setProducts] = useState([]);
    const [categoryOrder, setCategoryOrder] = useState([]);
    const [categoryImages, setCategoryImages] = useState({});
    const [loading, setLoading] = useState(true);

    // UI menu
    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [sortBy, setSortBy] = useState('featured');

    // Debounce search
    const debouncer = useCallback(debounce((v) => setDebouncedSearch(v), 400), []);
    const handleSearchChange = (e) => {
        const v = e.target.value;
        setSearchQuery(v);
        debouncer(v);
    };

    // Fetch products
    useEffect(() => {
        setLoading(true);
        fetch('https://clothing-backend.fly.dev/api/products')
            .then((res) => res.json())
            .then((data) => setProducts(Array.isArray(data) ? data : []))
            .catch((err) => console.error('Error fetching products:', err))
            .finally(() => setLoading(false));
    }, []);

    // Fetch categories (order + images)
    useEffect(() => {
        setLoading(true);
        fetch('https://clothing-backend.fly.dev/api/categories')
            .then((res) => res.json())
            .then((data) => {
                if (!Array.isArray(data)) return;
                const order = data.map((c) => c.name);
                const imageMap = {};
                data.forEach((c) => {
                    imageMap[c.name] = {
                        imageUrl: c.imageUrl,       // desktop
                        imageMobile: c.imageMobile, // mobile
                    };
                });
                setCategoryOrder(order);
                setCategoryImages(imageMap);
            })
            .catch((err) => console.error('Error fetching categories:', err))
            .finally(() => setLoading(false));
    }, []);

    // Chips: categorías presentes
    const categoriesInProducts = useMemo(() => {
        const setCat = new Set((products || []).map((p) => p.category).filter(Boolean));
        return [
            'All',
            ...categoryOrder.filter((c) => setCat.has(c)),
            ...[...setCat].filter((c) => !categoryOrder.includes(c)),
        ];
    }, [products, categoryOrder]);

    // Filtrado por texto + categoría
    const filtered = useMemo(() => {
        const byText = (p) =>
            (p.name || '').toLowerCase().includes((debouncedSearch || '').toLowerCase());
        const byCat = (p) => selectedCategory === 'All' || p.category === selectedCategory;
        return (products || []).filter((p) => byText(p) && byCat(p));
    }, [products, debouncedSearch, selectedCategory]);

    // Orden
    const sortFn = useCallback(
        (a, b) => {
            switch (sortBy) {
                case 'price-asc':
                    return Number(a.price) - Number(b.price);
                case 'price-desc':
                    return Number(b.price) - Number(a.price);
                case 'newest':
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case 'discount':
                    return Number(b.discount || 0) - Number(a.discount || 0);
                default:
                    return 0; // featured
            }
        },
        [sortBy]
    );

    // Agrupar (respeta order y agrega faltantes)
    const groupedFiltered = useMemo(() => {
        const base = categoryOrder
            .map((cat) => ({
                type: cat,
                products: filtered.filter((p) => p.category === cat).sort(sortFn),
            }))
            .filter((g) => g.products.length > 0);

        const present = new Set(filtered.map((p) => p.category));
        const remaining = [...present]
            .filter((c) => !categoryOrder.includes(c))
            .map((cat) => ({
                type: cat,
                products: filtered.filter((p) => p.category === cat).sort(sortFn),
            }));

        return [...base, ...remaining];
    }, [filtered, categoryOrder, sortFn]);

    // Qué renderizar
    const groupsToRender = useMemo(() => {
        return selectedCategory === 'All'
            ? groupedFiltered
            : groupedFiltered.filter((g) => g.type === selectedCategory);
    }, [groupedFiltered, selectedCategory]);

    // Helpers UI
    const getSizeChips = (product) => {
        if (product?.hasSizes && product?.sizes && typeof product.sizes === 'object') {
            // Orden común de tallas si existen
            const commonOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
            const keys = Object.keys(product.sizes);
            const ordered = [
                ...commonOrder.filter((k) => keys.includes(k)),
                ...keys.filter((k) => !commonOrder.includes(k)),
            ];
            return ordered.map((size) => ({
                label: size,
                available: Number(product.sizes[size]) > 0,
            }));
        }
        // Sin tallas: mostrar stock general
        return [{ label: `Stock: ${Number(product.stock ?? 0)}`, available: Number(product.stock ?? 0) > 0 }];
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-white font-sans">
            {/* ================= HERO ================= */}
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
                {/* Capa oscura */}
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
                </div>
            </motion.div>

            {/* ================= MENÚ ================= */}
            <div className="px-6 md:px-16 mt-12">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Shop</h2>
                        <p className="text-sm text-gray-300">
                            {filtered.length} producto(s)
                            {selectedCategory !== 'All' ? ` · ${selectedCategory}` : ''}
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {/* Search */}
                        <div className="relative flex-1 md:w-96">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar productos..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                                className="w-full pl-11 pr-4 py-3 rounded-xl bg-neutral-900 text-white placeholder-gray-400 border border-zinc-800 focus:outline-none focus:border-fuchsia-600 transition"
                            />
                        </div>

                        {/* Sort */}
                        {/* <div className="relative">
                            <FaSortAmountDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none pl-9 pr-8 py-3 rounded-xl bg-neutral-900 border border-zinc-800 focus:border-fuchsia-600"
                                title="Sort"
                            >
                                <option value="featured">Destacados</option>
                                <option value="newest">Más nuevos</option>
                                <option value="price-asc">Precio: bajo a alto</option>
                                <option value="price-desc">Precio: alto a bajo</option>
                                <option value="discount">Mayor descuento</option>
                            </select>
                        </div> */}
                    </div>
                </div>

                {/* Chips categorías */}
                <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
                    <span className="text-xs text-gray-300 flex items-center gap-2">
                        <FaFilter /> Categorías:
                    </span>
                    {categoriesInProducts.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-full border text-sm whitespace-nowrap ${selectedCategory === cat
                                ? 'bg-fuchsia-600 border-fuchsia-600'
                                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* ================= CONTENIDO (banner + carrusel) ================= */}
            <div className="px-6 md:px-16 py-16">
                {groupsToRender.map((group) => (
                    <React.Fragment key={group.type}>
                        {/* Banner categoría */}
                        {loading ? (
                            <div className="w-full h-[60vh] sm:h-[70vh] md:h-[80vh] xl:h-[90vh] my-16 rounded-xl overflow-hidden">
                                <Skeleton
                                    height="100%"
                                    width="100%"
                                    baseColor="#27272a"
                                    highlightColor="#3f3f46"
                                    className="rounded-xl"
                                />
                            </div>
                        ) : (
                            categoryImages[group.type] && (
                                <motion.div
                                    initial={{ opacity: 0, filter: 'grayscale(100%)' }}
                                    whileInView={{ opacity: 1, filter: 'grayscale(0%)' }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className="relative w-full h-[75vh] sm:h-[70vh] md:h-[80vh] xl:h-[90vh] overflow-hidden rounded-xl shadow-2xl my-16"
                                >
                                    <picture>
                                        {categoryImages[group.type]?.imageMobile && (
                                            <source
                                                media="(max-width: 768px)"
                                                srcSet={categoryImages[group.type].imageMobile}
                                            />
                                        )}

                                        <img
                                            src={categoryImages[group.type].imageUrl}
                                            alt={`${group.type} Collection`}
                                            className="relative inset-0 w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                                        />
                                    </picture>

                                    <div className="absolute inset-0 bg-black/40 flex flex-col justify-center items-center text-center px-4 md:px-8">
                                        <h2 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-extrabold uppercase text-white drop-shadow-xl tracking-wide">
                                            {group.type}
                                            <span className="block text-fuchsia-400">Collection</span>
                                        </h2>
                                    </div>
                                </motion.div>
                            )
                        )}

                        {/* Carrusel */}
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

                            <div className="flex overflow-x-auto gap-8 py-6 scroll-smooth scrollbar-thin scrollbar-thumb-fuchsia-500 scrollbar-track-transparent">
                                {loading
                                    ? Array(4)
                                        .fill()
                                        .map((_, i) => (
                                            <div
                                                key={i}
                                                className="flex-shrink-0 w-[280px] h-[460px] bg-neutral-800 rounded-xl overflow-hidden relative group shadow-lg p-4"
                                            >
                                                <Skeleton height={300} className="rounded" />
                                                <Skeleton height={20} className="mt-4" />
                                                <Skeleton width={100} height={16} />
                                            </div>
                                        ))
                                    : group.products.map((product, i) => {
                                        const sizeChips = getSizeChips(product);
                                        const hasDiscount = Number(product.discount) > 0 && product.originalPrice;

                                        return (
                                            <motion.div
                                                key={product._id}
                                                initial={{ opacity: 0, y: 50 }}
                                                whileInView={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.5, delay: i * 0.08 }}
                                                viewport={{ once: true }}
                                                className="relative flex-shrink-0 w-[280px] h-[460px] bg-neutral-800 rounded-xl overflow-hidden group shadow-lg hover:shadow-2xl transition duration-300"
                                            >
                                                {/* Imagen principal + hover */}
                                                <Link
                                                    to={`/product/${product._id}`}
                                                    onClick={() => window.scrollTo(0, 0)}
                                                    className="block w-full h-full"
                                                >
                                                    <img
                                                        src={product.coverImage}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
                                                    />
                                                    {product.hoverImage && (
                                                        <img
                                                            className="absolute top-0 left-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
                                                            src={product.hoverImage}
                                                            alt={`${product.name} alt`}
                                                        />
                                                    )}
                                                </Link>

                                                {/* Reveal de tallas / stock (aparece al hover o tap) */}
                                                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 p-4">
                                                    <div className="translate-y-5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                                        <div className="bg-black/70 backdrop-blur-md border border-zinc-700 rounded-xl p-3">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <FaTag className="text-fuchsia-400" />
                                                                <span className="text-sm text-gray-300">Disponibilidad</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {sizeChips.map((chip, idx) => (
                                                                    <button
                                                                        key={idx}
                                                                        type="button"
                                                                        className={`pointer-events-auto text-xs px-3 py-1.5 rounded-full border ${chip.available
                                                                            ? 'bg-zinc-900 border-zinc-700 hover:border-fuchsia-600'
                                                                            : 'bg-zinc-800 border-zinc-700 opacity-50 cursor-not-allowed'
                                                                            }`}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            e.preventDefault();
                                                                            // Navegar al detalle, preselección vía query param (opcional)
                                                                            if (product.hasSizes && chip.label !== undefined && chip.label !== null) {
                                                                                navigate(`/product/${product._id}?size=${encodeURIComponent(chip.label)}`);
                                                                            } else {
                                                                                navigate(`/product/${product._id}`);
                                                                            }
                                                                        }}
                                                                        disabled={!chip.available}
                                                                        title={chip.available ? 'Ver detalle' : 'Agotado'}
                                                                    >
                                                                        {chip.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Info fija (nombre, precio, descuento) */}
                                                <div className="absolute bottom-4 left-4 right-4 z-10 bg-black/70 text-white p-4 rounded-lg shadow-md">
                                                    <h4 className="font-bold text-lg truncate">{product.name}</h4>
                                                    {hasDiscount ? (
                                                        <div className="mt-1">
                                                            <span className="text-xs bg-red-500 text-white font-semibold px-2 py-1 rounded-full mr-2">
                                                                -{product.discount}% OFF
                                                            </span>
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="text-sm line-through text-gray-400">
                                                                    ${Number(product.originalPrice).toFixed(2)}
                                                                </span>
                                                                <span className="text-pink-400 font-bold text-lg">
                                                                    ${Number(product.price).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-pink-300">${Number(product.price).toFixed(2)}</p>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                            </div>
                        </div>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};

export default Products;
