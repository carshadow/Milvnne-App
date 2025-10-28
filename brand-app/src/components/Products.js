import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaFilter, FaSortAmountDown } from "react-icons/fa";
import { debounce } from "lodash";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

const PAGE_SIZE = 12;

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
    const [selectedSize, setSelectedSize] = useState(searchParams.get("size") || "All");
    const [sortBy, setSortBy] = useState(searchParams.get("sort") || "featured");
    const [visible, setVisible] = useState(PAGE_SIZE);

    // Fetch products
    useEffect(() => {
        setLoading(true);
        fetch("https://clothing-backend.fly.dev/api/products")
            .then((res) => res.json())
            .then((data) => setProducts(Array.isArray(data) ? data : []))
            .catch((err) => console.error("Error fetching products:", err))
            .finally(() => setLoading(false));
    }, []);

    // Fetch categories (order + images)
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

    // Debounce search
    const debouncer = useCallback(
        debounce((v) => setDebouncedSearch(v), 500),
        []
    );
    const handleSearchChange = (e) => {
        const v = e.target.value;
        setSearchQuery(v);
        debouncer(v);
    };

    // Build chips (categorías presentes en productos)
    const categoriesInProducts = useMemo(() => {
        const setCat = new Set(products.map((p) => p.category).filter(Boolean));
        return ["All", ...categoryOrder.filter((c) => setCat.has(c)), ...[...setCat].filter((c) => !categoryOrder.includes(c))];
    }, [products, categoryOrder]);

    // Aplicar filtros
    const filtered = useMemo(() => {
        const byText = (p) =>
            (p.name || "").toLowerCase().includes((debouncedSearch || "").toLowerCase());
        const byCat = (p) => selectedCategory === "All" || p.category === selectedCategory;
        const bySize = (p) => {
            if (selectedSize === "All") return true;
            if (!p.hasSizes) return false;
            const qty = p.sizes?.[selectedSize] ?? 0;
            return qty > 0;
        };
        return (products || []).filter((p) => byText(p) && byCat(p) && bySize(p));
    }, [products, debouncedSearch, selectedCategory, selectedSize]);

    // Sort
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
            default: // featured
                // puedes implementar tu propia lógica de “destacados”
                break;
        }
        return arr;
    }, [filtered, sortBy]);

    // URL sync
    useEffect(() => {
        const params = {};
        if (debouncedSearch) params.q = debouncedSearch;
        if (selectedCategory && selectedCategory !== "All") params.cat = selectedCategory;
        if (selectedSize && selectedSize !== "All") params.size = selectedSize;
        if (sortBy && sortBy !== "featured") params.sort = sortBy;
        setSearchParams(params, { replace: true });
    }, [debouncedSearch, selectedCategory, selectedSize, sortBy, setSearchParams]);

    // Reset paginación si cambian filtros
    useEffect(() => setVisible(PAGE_SIZE), [debouncedSearch, selectedCategory, selectedSize, sortBy]);

    // Banner de categoría (si no es “All”)
    const activeBanner = selectedCategory !== "All" ? categoryImages[selectedCategory] : null;

    return (
        <div className="min-h-screen bg-black text-white">
            {/* HERO compacto */}
            <div className="pt-24 px-4 md:px-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                            Shop <span className="text-fuchsia-500">MILVNNE</span>
                        </h1>
                        <p className="text-sm text-gray-400 mt-1">
                            {sorted.length} producto(s){selectedCategory !== "All" ? ` · ${selectedCategory}` : ""}
                            {selectedSize !== "All" ? ` · Talla ${selectedSize}` : ""}
                        </p>
                    </div>

                    {/* Search + Sort */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-80">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder="Buscar productos…"
                                className="w-full pl-10 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 outline-none focus:border-fuchsia-600"
                            />
                        </div>

                        <div className="relative">
                            <FaSortAmountDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="appearance-none pl-9 pr-8 py-2 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-fuchsia-600"
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

                {/* Chips de categorías */}
                <div className="mt-5 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    <span className="text-xs text-gray-400 flex items-center gap-2"><FaFilter /> Categorías:</span>
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

                    {/* Filtro por talla (si aplica a tus productos) */}
                    <div className="ml-auto flex items-center gap-2">
                        <span className="text-xs text-gray-400">Talla:</span>
                        {["All", "S", "M", "L", "XL"].map((s) => (
                            <button
                                key={s}
                                onClick={() => setSelectedSize(s)}
                                className={`px-3 py-1.5 rounded-full border text-sm ${selectedSize === s
                                        ? "bg-fuchsia-600 border-fuchsia-600"
                                        : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                                    }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Banner por categoría seleccionada */}
            <AnimatePresence mode="wait">
                {activeBanner && (
                    <motion.div
                        key={selectedCategory}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="mt-6 px-4 md:px-8"
                    >
                        <div className="max-w-7xl mx-auto relative h-[38vh] md:h-[44vh] overflow-hidden rounded-2xl border border-zinc-800">
                            <picture>
                                {activeBanner.imageMobile && (
                                    <source media="(max-width: 768px)" srcSet={activeBanner.imageMobile} />
                                )}
                                <img
                                    src={activeBanner.imageUrl}
                                    alt={`${selectedCategory} banner`}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            </picture>
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                            <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
                                <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
                                    {selectedCategory} <span className="text-fuchsia-500">Collection</span>
                                </h2>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* GRID */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
                {loading ? (
                    <SkeletonGrid />
                ) : sorted.length === 0 ? (
                    <EmptyState />
                ) : (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                            {sorted.slice(0, visible).map((p, idx) => (
                                <motion.article
                                    key={p._id}
                                    initial={{ opacity: 0, y: 12 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.25, delay: idx * 0.02 }}
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
                                                    <span className="px-2 py-1 rounded-full text-[10px] bg-black/60 border border-zinc-800">
                                                        S • M • L • XL
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <h3 className="font-semibold line-clamp-1">{p.name}</h3>
                                            <div className="mt-1 flex items-center gap-2">
                                                {Number(p.discount) > 0 && p.originalPrice ? (
                                                    <>
                                                        <span className="text-pink-400 font-bold">${Number(p.price).toFixed(2)}</span>
                                                        <span className="text-xs text-gray-400 line-through">
                                                            ${Number(p.originalPrice).toFixed(2)}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-white font-semibold">${Number(p.price).toFixed(2)}</span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </motion.article>
                            ))}
                        </div>

                        {/* Load more */}
                        {visible < sorted.length && (
                            <div className="flex justify-center mt-8">
                                <button
                                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                                    className="px-6 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-fuchsia-600"
                                >
                                    Mostrar más
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

/* ==== Subcomponentes ==== */

function SkeletonGrid() {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 p-3">
                    <Skeleton height={240} baseColor="#18181b" highlightColor="#27272a" />
                    <Skeleton height={16} className="mt-3" baseColor="#18181b" highlightColor="#27272a" />
                    <Skeleton height={14} width={80} baseColor="#18181b" highlightColor="#27272a" />
                </div>
            ))}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="text-center py-24">
            <div className="mx-auto h-24 w-24 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                🛒
            </div>
            <h2 className="mt-6 text-2xl md:text-3xl font-extrabold">Sin resultados</h2>
            <p className="mt-2 text-gray-400">Prueba con otro término, categoría o talla.</p>
        </div>
    );
}
