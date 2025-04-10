import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FaQuoteLeft, FaBrain, FaRocket, FaInfoCircle } from 'react-icons/fa';

const Hero = () => {

    const [imageIndex, setImageIndex] = useState(0);
    const [selectedImg, setSelectedImg] = useState(null);
    const images = [
        '/images/Dori.png',
        '/images/oriela.png',
        '/images/jeanHoodie.png',
        '/images/gymWear.png',
        '/images/accesories.png',
    ];

    const cards = [
        { src: '/images/oriela.png', label: 'ATHLETIC', video: "/images/v09044g40000cnf06knog65nfj7d1o7g.MP4" },
        { src: '/images/comfy.png', label: 'COMFY', video: "/images/v15044gf0000cv50gffog65lmvf5l6c0.MP4" },
        { src: '/images/joggersHover.png', label: 'RUNNING', video: "/images/v09044g40000cnf06knog65nfj7d1o7g.MP4" },
        { src: '/images/accesories.png', label: 'ACCESSORIES', video: "/images/v12044gd0000cucm4ifog65kc90dtra0.MP4" },
        { src: '/images/gymWear.png', label: 'GYM', video: "/images/v15044gf0000cs6205fog65qimm34gog.MP4" },
    ];

    const galleryImages = [
        "/images/gymWear.png",
        "/images/gymWear.png",
        "/images/gymWear.png",
        "/images/gymWear.png",
        "/images/gymWear.png",
        "/images/gymWear.png",
        "/images/gymWear.png",
        "/images/gymWear.png",
    ];
    useEffect(() => {
        // About Us Section Observer
        const aboutUs = document.querySelector("#about-us");

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    aboutUs.classList.add("opacity-100", "translate-y-0");
                }
            },
            { threshold: 0.2 }
        );

        observer.observe(aboutUs);

        // Stay Inspired Section Observer
        const inspiredSection = document.querySelectorAll(".inspired-item");

        const inspiredObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("opacity-100", "translate-x-0");
                    }
                });
            },
            { threshold: 0.2 }
        );

        inspiredSection.forEach((el) => inspiredObserver.observe(el));

        // Image Slideshow interval
        const interval = setInterval(() => {
            setImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        }, 3000); // Change image every 3 seconds

        // Cleanup the interval when the component is unmounted
        return () => clearInterval(interval);




    }, []);

    const [justasShirtId, setJustasShirtId] = useState(null);

    useEffect(() => {
        const fetchJustasShirt = async () => {
            try {
                const res = await fetch("http://localhost:8080/api/products");
                const products = await res.json();

                // Buscar la camisa de las justas en la base de datos
                const justasShirt = products.find(product =>
                    product.name.toLowerCase().includes("justas")
                );

                if (justasShirt) {
                    setJustasShirtId(justasShirt._id);
                }
            } catch (error) {
                console.error("Error al obtener productos:", error);
            }
        };

        fetchJustasShirt();
    }, []);


    const [slideIndex, setSlideIndex] = useState(0);

    const heroSlides = [
        { word: "Inspiración", image: "/images/Dori.png" },
        { word: "Moda", image: "/images/jeanHoodie.png" },
        { word: "Pasión", image: "/images/Worldwide.jpg" },
        { word: "Estilo", image: "/images/comfy.png" },
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setSlideIndex((prev) => (prev + 1) % heroSlides.length);
        }, 3000);

        return () => clearInterval(interval);
    }, []);


    const currentSlide = heroSlides[slideIndex];

    return (
        <div className="bg-black">
            <div className="relative h-screen w-full flex flex-col md:flex-row overflow-hidden bg-black">
                {/* 📸 Imagen (todo el fondo en mobile, mitad en desktop) */}
                <div className="w-full md:w-1/2 h-full relative">
                    <div className="absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out">
                        {heroSlides.map((slide, index) => (
                            <img
                                key={index}
                                src={slide.image}
                                alt={slide.word}
                                className={`absolute inset-0 w-full h-full object-cover rounded-none shadow-2xl transition-opacity duration-1000 ease-in-out
                        ${index === slideIndex ? "opacity-100 z-10" : "opacity-0 z-0"}`}
                            />
                        ))}
                    </div>

                    {/* 🟣 Texto superpuesto (solo en mobile) */}
                    <div className="md:hidden absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                        <motion.h1
                            key={currentSlide.word}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.8, ease: "easeInOut" }}
                            className="text-4xl sm:text-5xl font-extrabold uppercase tracking-widest text-white text-center drop-shadow-lg px-4"
                        >
                            {currentSlide.word}
                        </motion.h1>
                    </div>
                </div>

                {/* ✏️ Texto fijo (solo en desktop) */}
                <div className="hidden md:flex w-full md:w-1/2 h-full items-center justify-center bg-gradient-to-br from-black via-zinc-900 to-black text-white z-10">
                    <motion.h1
                        key={currentSlide.word}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 1, ease: "easeInOut" }}
                        className="text-5xl lg:text-7xl font-extrabold uppercase tracking-widest text-center px-6"
                    >
                        {currentSlide.word}
                    </motion.h1>
                </div>
            </div>


            {/* About Us Section with Transition */}
            <motion.div
                id="about-us"
                className="w-full bg-gradient-to-b from-black via-[#0f0f10] to-[#18181b] text-white py-20 px-6 md:px-16 flex flex-col md:flex-row items-center gap-12"
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: "easeOut" }}
            >
                {/* Texto */}
                <div className="w-full md:w-1/2 space-y-6">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-fuchsia-500 leading-tight">
                        MILVNNE STUDIOS
                    </h2>
                    <p className="text-lg text-gray-300 leading-relaxed">
                        En <span className="text-fuchsia-400 font-semibold">MILVNNE</span>, diseñamos mucho más que ropa:
                        creamos un lenguaje visual que refleja fuerza, autenticidad y movimiento.
                        No vestimos tendencias; vestimos actitud.
                    </p>
                    <p className="text-lg text-gray-300 leading-relaxed">
                        Fusionamos lo deportivo y lo urbano con piezas funcionales que se sienten como segunda piel.
                        Cada colección es una invitación a expresarte con confianza y romper lo establecido.
                    </p>
                    <p className="text-lg text-gray-300 leading-relaxed">
                        La moda es tu herramienta, y <span className="text-fuchsia-400 font-semibold">nosotros tu canvas</span>.
                        Explora. Experimenta. Evoluciona.
                    </p>
                </div>

                {/* Imagen animada */}
                <motion.div
                    className="w-full md:w-1/2 flex justify-center items-center "
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                >
                    <div className="bg-white/5 p-4 rounded-xl shadow-xl border border-white/10 backdrop-blur-sm">
                        <img
                            src="/images/logo2unscreen.gif"
                            alt="MILVNNE Logo Animation"
                            className="rounded-lg object-contain w-72 md:w-96 hover:scale-105 transition-transform duration-500"
                        />
                    </div>
                </motion.div>
            </motion.div>


            {/* Rectangular Images Section */}
            <div className="relative w-full h-screen bg-gradient-to-b from-black via-zinc-900 to-slate-300 overflow-hidden flex items-center justify-center px-6">
                {/* Background gradients / blur */}
                <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-800/30 via-indigo-900/20 to-black backdrop-blur-lg z-0"></div>

                {/* Text + carousel content */}
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between w-full max-w-7xl">
                    {/* Text Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -60 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="w-full md:w-1/2 mb-10 md:mb-0"
                    >
                        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
                            MÁS QUE ROPA, <br />
                            <span className="text-fuchsia-400">UNA ACTITUD</span>
                        </h2>
                        <p className="text-lg text-gray-300 mb-6 max-w-md">
                            En MILVNNE, el estilo es una declaración. Creamos piezas que se mueven contigo, que reflejan tu energía,
                            y que destacan tu individualidad. No sigues la moda. La rediseñas.
                        </p>
                        <Link to="/" onClick={() => window.scrollTo(0, 0)}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="px-6 py-3 bg-fuchsia-500 text-white rounded-full shadow-lg hover:bg-fuchsia-600 transition-all"
                            >
                                Ver Colecciones
                            </motion.button>
                        </Link>
                    </motion.div>

                    {/* Mini carousel / cards */}
                    <motion.div
                        initial={{ opacity: 0, x: 60 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        className="w-full md:w-1/2 flex gap-6 overflow-x-auto pb-4"
                    >
                        {cards.map((item, index) => (
                            <div
                                key={index}
                                className="relative flex-shrink-0 w-60 h-80 rounded-2xl overflow-hidden shadow-lg group hover:scale-105 transition-transform duration-300"
                            >
                                <img
                                    src={item.src}
                                    alt={item.label}
                                    className="w-full h-full object-cover transition-opacity duration-500"
                                />
                                <video
                                    src={item.video}
                                    muted
                                    loop
                                    playsInline
                                    preload="metadata"
                                    className="absolute top-0 left-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                    onMouseEnter={(e) => {
                                        const video = e.currentTarget;
                                        if (video.paused) {
                                            video.currentTime = 0;
                                            video.play().catch((err) => console.error("Play error:", err));
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        const video = e.currentTarget;
                                        video.pause();
                                        video.currentTime = 0;
                                    }}
                                />
                                <div className="absolute bottom-3 left-3 bg-black/60 px-4 py-2 rounded-md text-white text-sm font-semibold">
                                    {item.label}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>




            <div className="w-full bg-gradient-to-b from-black via-zinc-900 to-slate-300 py-24 px-6 md:px-20">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

                    {/* Left - Text Block */}
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1 }}
                        viewport={{ once: true }}
                        className="space-y-8 text-center lg:text-left"
                    >
                        <h2 className="text-4xl md:text-5xl font-bold text-white">
                            Stay <span className="text-fuchsia-500">Inspired</span>
                        </h2>
                        <p className="text-lg text-gray-300 leading-relaxed">
                            Cada cabeza es un mundo. En <span className="text-fuchsia-400 font-semibold">MILVNNE</span> entendemos que la mente es nuestro canvas y la ropa una extensión de quiénes somos.
                            Nuestras piezas son un recordatorio visual de que lo único que necesitas para alcanzar lo que sueñas — eres tú mismo.
                        </p>
                        <p className="text-lg text-gray-400 italic">“MILVNNE es WRLWIDE desde que decidí que el mundo era mío.”</p>
                    </motion.div>

                    {/* Right - Big crisp image with minimal overlay */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1 }}
                        viewport={{ once: true }}
                        className="relative w-full h-[500px] sm:h-[550px] md:h-[600px] lg:h-[650px] xl:h-[700px] overflow-hidden rounded-2xl shadow-2xl group"
                    >
                        {images.map((img, index) => (
                            <img
                                key={index}
                                src={img}
                                alt={`Inspiration ${index + 1}`}
                                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${index === imageIndex ? "opacity-100" : "opacity-0"
                                    }`}
                            />
                        ))}

                        {/* Optional overlay if needed */}
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-6">
                            <p className="text-white font-medium tracking-wide">Autenticidad en cada pieza.</p>
                        </div>
                    </motion.div>
                </div>
            </div>
            <div
                className="relative w-full min-h-screen bg-fixed bg-center bg-cover flex items-center justify-center"
                style={{ backgroundImage: `url('/images/UPRRC.png')` }}
            >
                {/* Overlay artístico */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/90 z-0"></div>

                {/* Contenido principal */}
                <div className="relative z-10 max-w-7xl w-full px-6 py-28 text-white">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-pink-500 to-fuchsia-400 mb-6 drop-shadow-lg">
                            UNIFORMADOS DE ACTITUD
                        </h2>
                        <p className="text-lg md:text-xl text-white max-w-3xl mx-auto leading-relaxed font-light">
                            La Universidad de Puerto Rico en Carolina corre con estilo propio. Esta colaboración con MILVNNE no es solo ropa,
                            es una expresión visual de fuerza, identidad y movimiento.
                        </p>
                    </motion.div>

                    {/* Galería adaptativa */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ duration: 1.2 }}
                        className="
        md:grid md:grid-cols-4 gap-6
        flex md:flex-none overflow-x-auto gap-4 pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-fuchsia-500/30
      "
                    >
                        {[
                            '/images/upr1.png',
                            '/images/upr2.png',
                            '/images/upr3.png',
                            '/images/upr4.png',
                            '/images/upr5.png',
                            '/images/upr6.png',
                            '/images/upr7.png',
                            '/images/upr8.png',
                            '/images/upr9.png',
                            '/images/upr10.png',
                            '/images/upr11.png',
                            '/images/upr12.png',
                        ].map((src, i) => (
                            <div
                                key={i}
                                className="relative min-w-[70%] md:min-w-0 md:w-auto group overflow-hidden rounded-3xl shadow-2xl border border-white/10 hover:scale-105 transition duration-500"
                            >
                                <img
                                    src={src}
                                    alt={`Foto equipo ${i + 1}`}
                                    className="w-full h-80 object-cover brightness-90 group-hover:brightness-110 transition-all duration-500"
                                />
                                {/* <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-300 flex items-end p-4">
                                    <span className="text-sm text-white font-medium">UPR Carolina x MILVNNE</span>
                                </div> */}
                            </div>
                        ))}
                    </motion.div>

                    {/* CTA */}
                    {/* <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mt-20"
                    >
                        <Link to="/collections">
                            <button className="px-8 py-4 rounded-full text-lg font-semibold bg-white text-fuchsia-600 hover:bg-fuchsia-600 hover:text-white transition-all shadow-xl">
                                Explorar Colecciones Inspiradas
                            </button>
                        </Link>
                    </motion.div> */}
                </div>
            </div>



            <section className="bg-gradient-to-b from-black via-zinc-900 to-slate-300 py-24 px-6 text-white">
                <div className="max-w-7xl mx-auto text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-extrabold text-fuchsia-500 mb-4">
                        Proyectos & Colaboraciones
                    </h2>
                    <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                        Nos enorgullece colaborar con comunidades, equipos y eventos que comparten nuestra visión de autenticidad, fuerza y evolución constante.
                    </p>
                </div>

                {/* GRID DE PROYECTOS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
                    {/* Proyecto 1 */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-xl hover:scale-[1.02] transition-transform duration-300">
                        <div className="h-64 overflow-hidden">
                            <img
                                src="/images/UPRRC.png"
                                alt="UPR Carolina"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="p-6 space-y-4">
                            <h3 className="text-2xl font-bold text-fuchsia-400">
                                UPR Carolina – Atletismo
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                Auspiciamos al equipo de atletismo de la UPR Carolina con uniformes exclusivos y una edición especial de camisa para las Justas.
                            </p>
                            {/* <Link
                                to={`/product/${justasShirtId}`}
                                onClick={() => window.scrollTo(0, 0)}
                                className="inline-block px-5 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 transition"
                            >
                                Ver Camisa
                            </Link> */}
                        </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-xl hover:scale-[1.02] transition-transform duration-300">
                        <div className="h-64 overflow-hidden">
                            <img
                                src="/images/justas25.jpeg"
                                alt="UPR Carolina"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="p-6 space-y-4">
                            <h3 className="text-2xl font-bold text-indigo-400">
                                UPR Carolina – Atletismo
                            </h3>
                            <p className="text-sm text-gray-300 leading-relaxed">
                                Auspiciamos al equipo de atletismo de la UPR Carolina con uniformes exclusivos y una edición especial de camisa para las Justas.
                            </p>
                            <Link
                                to={`/product/${justasShirtId}`}
                                onClick={() => window.scrollTo(0, 0)}
                                className="inline-block px-5 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 transition"
                            >
                                Ver Camisa
                            </Link>
                        </div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden shadow-xl hover:scale-[1.02] transition-transform duration-300">
                        <div className="h-64 overflow-hidden">
                            <img
                                src="/images/UPRRC.png"
                                alt="UPR Carolina"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="p-6 space-y-4">
                            <h3 className="text-2xl font-bold text-red-500">
                                UPR Carolina – Atletismo
                            </h3>
                            <p className="text-sm text-black md:text-gray-300 leading-relaxed">
                                Auspiciamos al equipo de atletismo de la UPR Carolina con uniformes exclusivos y una edición especial de camisa para las Justas.
                            </p>
                            {/* <Link
                                to={`/product/${justasShirtId}`}
                                onClick={() => window.scrollTo(0, 0)}
                                className="inline-block px-5 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 transition"
                            >
                                Ver Camisa
                            </Link> */}
                        </div>
                    </div>


                </div>
            </section>


            <div
                className="flex flex-col md:flex-row items-center justify-between px-8 py-20 text-white gap-12 bg-gradient-to-br from-black via-zinc-900 to-slate-800"
            >
                {/* Quote */}
                <div className="w-full md:w-1/2 space-y-6">
                    <blockquote className="text-3xl md:text-4xl font-extrabold leading-snug tracking-tight text-fuchsia-400">
                        “La disciplina es el puente entre las metas y los logros.”
                    </blockquote>
                    <p className="text-lg text-gray-300 max-w-md">
                        En MILVNNE, entendemos que tu actitud y disciplina son lo que transforma una prenda en una declaración.
                        Este es tu espacio, tu momento, tu evolución.
                    </p>
                </div>

                {/* Video */}
                <div className="w-full md:w-1/2 relative">
                    <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/10 backdrop-blur-sm bg-white/5">
                        <video
                            src="/images/videowaw.mov"
                            controls
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>


            <footer className="bg-gradient-to-b from-black via-zinc-900 to-slate-300 text-white py-24 px-6">
                <div className="max-w-7xl mx-auto text-center space-y-10">
                    {/* Título & CTA */}
                    <div>
                        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
                            Conecta con <span className="text-fuchsia-400">MILVNNE</span>
                        </h2>
                        <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-6">
                            Sigue nuestro movimiento en Instagram y descubre contenido exclusivo, lanzamientos, colaboraciones y más.
                        </p>
                        <a
                            href="https://www.instagram.com/milvnne.studios/?hl=es"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-8 py-4 bg-fuchsia-600 text-white rounded-full font-semibold shadow-lg hover:bg-fuchsia-700 transition duration-300"
                        >
                            Síguenos en Instagram
                        </a>
                    </div>

                    {/* Galería tipo grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                        {["/images/justas25.jpeg", "/images/Worldwide.jpg", "/images/comfy.png", "/images/running.png"].map((src, index) => (
                            <div
                                key={index}
                                className="relative group overflow-hidden rounded-xl border border-white/10 shadow-xl"
                            >
                                <img
                                    src={src}
                                    alt={`Instagram Post ${index + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                    <span className="text-sm text-white font-semibold tracking-wide">
                                        Ver más
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Linea + Marca final */}
                    {/* <div className="mt-12 border-t border-white/20 pt-6 text-sm text-gray-400">
                        © {new Date().getFullYear()} MILVNNE STUDIOS — Todos los derechos reservados
                    </div> */}
                </div>
            </footer>



        </div>
    );
};

export default Hero;
