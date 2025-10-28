import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaFilter, FaSortAmountDown } from "react-icons/fa";
import { debounce } from "lodash";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function Products() {
    const [products, setProducts] = useState([]);
    const [categoryOrder, setCategoryOrder] = useState([]);
    const [categoryImages, setCategoryImages] = useState({});
    const [loading, setLoading] = useState(true);

    // Filtros / UI
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
    const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("q") || "");
    const [selectedCategory, setSelectedCategory] = useState(searchParams.get("cat") || "All");
    const [sortBy, setSortBy] = useState(searchParams.get("sort") || "featured");

    // === FETCHS ===
    useEffect(() => {
        setLoading(true);
        fetch("https://clothing-backend.fly.dev/api/products")
            .then((res) => res.json())
            .then((data) => setProducts(Array.isArray(data) ? data : []))
            .catch((err) => console.error("Error fetching products:", err))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        fetch("https://clothing-backend.fly.dev/api/categories")
            .then((res) => res.json())
            .then((data) => {
                if (!Array.isArray(data)) return;
                const order = data.map((c) => c.name);
                const imageMap = {};
                data.forEach((c) => {
                    imageMap[c.name] = {
                        imageUrl: c.imageUrl,
                        imageMobile: c.imageMobile,
                    };
                });
                setCategoryOrder(order);
                setCategoryImages(imageMap);
            })
            .catch((err) => console.error("Error fetching categories:", err));
    }, []);

    // === SEARCH (debounce) ===
    const debouncer = useCallback(
        debounce((v) => setDebouncedSearch(v), 500),
        []
    );
    const handleSearchChange = (e) => {
        const v = e.target.value;
        setSearchQuery(v);
        debouncer(v);
    };

    // === CHIPS / LISTAS ===
    const categoriesInProducts = useMemo(() => {
        const setCat = new Set(products.map((p) => p.category).filter(Boolean));
        return ["All", ...categoryOrder.filter((c) => setCat.has(c)), ...[...setCat].filter((c) => !categoryOrder.includes(c))];
    }, [products, categoryOrder]);

    // === FILTRADO + SORT ===
    const filtered = useMemo(() => {
        const byText = (p) =>
            (p.name || "").toLowerCase().includes((debouncedSearch || "").toLowerCase());
        const byCat = (p) => selectedCategory === "All" || p.category === selectedCategory;
        return (products || []).filter((p) => byText(p) && byCat(p));
    }, [products, debouncedSearch, selectedCategory]);

    const sorted = useMemo(() => {
        const arr = [...filtered];
        switch (sortBy) {
            case "price-asc":
                arr.sort((a, b) => Number(a.price) - Number(b.price));
                break;
            case "price-desc":
                arr.sort((a, b) => Number(b.price) - Number(a.price));
                break;
            case "newest":
                arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case "discount":
                arr.sort((a, b) => Number(b.discount || 0) - Number(a.discount || 0));
                break;
            default:
                break;
        }
        return arr;
    }, [filtered, sortBy]);

    // === URL SYNC ===
    useEffect(() => {
        const params = {};
        if (debouncedSearch) params.q = debouncedSearch;
        if (selectedCategory && selectedCategory !== "All") params.cat = selectedCategory;
        if (sortBy && sortBy !== "featured") params.sort = sortBy;
        setSearchParams(params, { replace: true });
    }, [debouncedSearch, selectedCategory, sortBy, setSearchParams]);

    // === GROUPING POR CATEGORÍA (para “All”) ===
    const filteredProducts = sorted; // alias
    const categoriesPresent = [...new Set(filteredProducts.map((p) => p.category))];

    const groupedProducts = useMemo(() => {
        // respeta tu order; luego agrega las que falten
        const base = categoryOrder
            .map((cat) => ({
                type: cat,
                products: filteredProducts.filter((p) => p.category === cat),
            }))
            .filter((g) => g.products.length > 0);

        const remaining = categoriesPresent
            .filter((c) => !categoryOrder.includes(c))
            .map((cat) => ({
                type: cat,
                products: filteredProducts.filter((p) => p.category === cat),
            }));

        return [...base, ...remaining];
    }, [filteredProducts, categoryOrder, categoriesPresent]);

    // === UTIL ===
    const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-slate-400 text-white font-sans">
            {/* ============== HERO (MISMO QUE TENÍAS) ============== */}
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

            {/* ============== SEARCH + SORT + CHIPS ============== */}
            <div className="px-6 md:px-16 mt-12">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Shop</h2>
                        <p className="text-sm text-gray-300">
                            {sorted.length} producto(s){selectedCategory !== "All" ? ` · ${selectedCategory}` : ""}
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
                        <div className="relative">
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
                        </div>
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
                                    ? "bg-fuchsia-600 border-fuchsia-600"
                                    : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* ============== CONTENIDO PRINCIPAL ============== */}
            <div className="px-6 md:px-16 py-16">
                {/* Modo “All”: mismo FLOW por categoría (banner mismo tamaño + carrusel) */}
                {selectedCategory === "All" ? (
                    <>
                        {groupedProducts.map((group) => (
                            <React.Fragment key={group.type}>
                                {/* Banner de categoría (MISMAS ALTURAS que tenías) */}
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
                                ) : categoryImages[group.type] && (
                                    <motion.div
                                        initial={{ opacity: 0, filter: "grayscale(100%)" }}
                                        whileInView={{ opacity: 1, filter: "grayscale(0%)" }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] xl:h-[90vh] overflow-hidden rounded-xl shadow-2xl my-16"
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
                                )}

                                {/* Carrusel (mismo flow) */}
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
                                            ? Array(4).fill().map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="flex-shrink-0 w-[280px] h-[460px] bg-neutral-800 rounded-xl overflow-hidden relative group shadow-lg p-4"
                                                >
                                                    <Skeleton height={300} className="rounded" />
                                                    <Skeleton height={20} className="mt-4" />
                                                    <Skeleton width={100} height={16} />
                                                </div>
                                            ))
                                            : group.products.map((product, idx) => (
                                                <motion.div
                                                    key={product._id}
                                                    initial={{ opacity: 0, y: 50 }}
                                                    whileInView={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.5, delay: idx * 0.08 }}
                                                    viewport={{ once: true }}
                                                    className="flex-shrink-0 w-[280px] h-[460px] bg-neutral-800 rounded-xl overflow-hidden relative group shadow-lg hover:shadow-2xl transition duration-300"
                                                >
                                                    <Link to={`/product/${product._id}`} onClick={() => window.scrollTo(0, 0)}>
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
                                                        <div className="absolute bottom-4 left-4 right-4 z-20 bg-black/70 text-white p-4 rounded-lg shadow-md">
                                                            <h4 className="font-bold text-lg truncate">{product.name}</h4>

                                                            {Number(product.discount) > 0 ? (
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
                    </>
                ) : (
                    /* Modo categoría específica: MISMO BANNER + GRID limpio (más tipo Adidas) */
                    <CategoryOnlyView
                        category={selectedCategory}
                        products={sorted.filter((p) => p.category === selectedCategory)}
                        banner={categoryImages[selectedCategory]}
                        fmt={fmt}
                    />
                )}
            </div>
        </div>
    );
}

/* ====== Subcomponentes ====== */

function CategoryOnlyView({ category, products, banner, fmt }) {
    return (
        <>
            <AnimatePresence mode="wait">
                {banner && (
                    <motion.div
                        key={category}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="relative w-full h-[60vh] sm:h-[70vh] md:h-[80vh] xl:h-[90vh] overflow-hidden rounded-xl shadow-2xl my-16"
                    >
                        <picture>
                            {banner.imageMobile && <source media="(max-width: 768px)" srcSet={banner.imageMobile} />}
                            <img src={banner.imageUrl} alt={`${category} banner`} className="h-full w-full object-cover" loading="lazy" />
                        </picture>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        <div className="absolute bottom-6 left-6">
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold uppercase drop-shadow-xl">
                                {category} <span className="text-fuchsia-400">Collection</span>
                            </h2>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {products.length === 0 ? (
                <div className="text-center py-20 text-gray-300">No hay productos en esta categoría.</div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                    {products.map((p, i) => (
                        <motion.article
                            key={p._id}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.25, delay: i * 0.04 }}
                            className="group relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950"
                        >
                            <Link to={`/product/${p._id}`} onClick={() => window.scrollTo(0, 0)}>
                                <div className="relative aspect-[3/4] overflow-hidden">
                                    <img
                                        src={p.coverImage}
                                        alt={p.name}
                                        className="h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-0"
                                        loading="lazy"
                                    />
                                    {p.hoverImage && (
                                        <img
                                            src={p.hoverImage}
                                            alt={`${p.name} alt`}
                                            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                                            loading="lazy"
                                        />
                                    )}
                                    {/* Badges */}
                                    <div className="absolute top-2 left-2 flex gap-2">
                                        {Number(p.discount) > 0 && (
                                            <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-600">-{p.discount}%</span>
                                        )}
                                        {p.hasSizes && (
                                            <span className="px-2 py-1 rounded-full text-[10px] bg-black/60 border border-zinc-800">S • M • L • XL</span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-3">
                                    <h3 className="font-semibold line-clamp-1">{p.name}</h3>
                                    <div className="mt-1 flex items-center gap-2">
                                        {Number(p.discount) > 0 && p.originalPrice ? (
                                            <>
                                                <span className="text-pink-400 font-bold">{fmt(p.price)}</span>
                                                <span className="text-xs text-gray-400 line-through">{fmt(p.originalPrice)}</span>
                                            </>
                                        ) : (
                                            <span className="text-white font-semibold">{fmt(p.price)}</span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </motion.article>
                    ))}
                </div>
            )}
        </>
    );
}
