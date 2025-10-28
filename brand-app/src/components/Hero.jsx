import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Hero = () => {
    // ==== DATA (igual que la tuya) ====
    const images = useMemo(() => [
        '/images/Dori.png',
        '/images/oriela.png',
        '/images/jeanHoodie.png',
        '/images/gymWear.png',
        '/images/accesories.png',
    ], []);

    const cards = useMemo(() => [
        { src: '/images/oriela.png', label: 'ATHLETIC', video: '/images/v09044g40000cnf06knog65nfj7d1o7g.MP4' },
        { src: '/images/comfy.png', label: 'COMFY', video: '/images/v15044gf0000cv50gffog65lmvf5l6c0.MP4' },
        { src: '/images/joggershover.png', label: 'RUNNING', video: '/images/v09044g40000cnf06knog65nfj7d1o7g.MP4' },
        { src: '/images/accesories.png', label: 'ACCESSORIES', video: '/images/v12044gd0000cucm4ifog65kc90dtra0.MP4' },
        { src: '/images/gymWear.png', label: 'GYM', video: '/images/v15044gf0000cs6205fog65qimm34gog.MP4' },
    ], []);

    const heroSlides = useMemo(() => [
        { word: 'Inspiración', image: '/images/Dori.png' },
        { word: 'Moda', image: '/images/jeanHoodie.png' },
        { word: 'Pasión', image: '/images/Worldwide.jpg' },
        { word: 'Estilo', image: '/images/comfy.png' },
    ], []);

    // ==== Estado ====
    const [slideIndex, setSlideIndex] = useState(0);
    const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    useEffect(() => {
        if (reduceMotion) return;
        const id = setInterval(() => setSlideIndex((i) => (i + 1) % heroSlides.length), 3000);
        return () => clearInterval(id);
    }, [reduceMotion, heroSlides.length]);

    const [imageIndex, setImageIndex] = useState(0);
    useEffect(() => {
        if (reduceMotion) return;
        const id = setInterval(() => setImageIndex((i) => (i + 1) % images.length), 3000);
        return () => clearInterval(id);
    }, [reduceMotion, images.length]);

    const [justasShirtId, setJustasShirtId] = useState(null);
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('https://clothing-backend.fly.dev/api/products');
                const products = await res.json();
                const justasShirt = products.find((p) => p.name?.toLowerCase().includes('justas'));
                if (justasShirt) setJustasShirtId(justasShirt._id);
            } catch (e) {
                console.error('Error al obtener productos:', e);
            }
        })();
    }, []);

    // ==== Helpers UI ====
    const shell = 'bg-gradient-to-b from-black via-zinc-900 to-zinc-950';
    const h1 = 'text-[clamp(2.25rem,8vw,5rem)] font-extrabold uppercase tracking-widest';
    const h2 = 'text-[clamp(1.75rem,4.5vw,3rem)] font-extrabold';
    const body = 'text-base md:text-lg leading-8 text-gray-300';

    return (
        <div className="bg-black text-white">
            {/* ===== HERO ===== */}
            <section className={`relative min-h-[90svh] w-full overflow-hidden ${shell}`} aria-label="Hero MILVNNE">
                {/* Capa imágenes */}
                <div className="absolute inset-0">
                    {heroSlides.map((s, i) => (
                        <img
                            key={i}
                            src={s.image}
                            alt={s.word}
                            fetchpriority={i === 0 ? 'high' : undefined}
                            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${i === slideIndex ? 'opacity-100' : 'opacity-0'}`}
                        />
                    ))}
                    <div className="absolute inset-0 bg-black/45" />
                </div>

                {/* Copy + indicadores */}
                <div className="relative z-10 flex h-[90svh] items-center justify-center px-6">
                    <motion.h1
                        key={heroSlides[slideIndex].word}
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className={`${h1} text-center`}
                    >
                        {heroSlides[slideIndex].word}
                    </motion.h1>

                    {/* Indicadores */}
                    <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 flex gap-2">
                        {heroSlides.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setSlideIndex(i)}
                                aria-label={`Ir al slide ${i + 1}`}
                                className={`h-2.5 w-2.5 rounded-full transition ${i === slideIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/70'}`}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== ABOUT US ===== */}
            <section id="about-us" aria-labelledby="about-title" className={`${shell} text-white py-20 px-6 md:px-16`}>
                <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 md:flex-row">
                    {/* Texto */}
                    <motion.div
                        initial={{ opacity: 0, y: 36 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="w-full space-y-6 md:w-1/2"
                    >
                        <h2 id="about-title" className={`${h2} text-fuchsia-500 leading-tight`}>MILVNNE STUDIOS</h2>
                        <p className={body}>
                            En <span className="text-fuchsia-400 font-semibold">MILVNNE</span>, diseñamos mucho más que ropa:
                            creamos un lenguaje visual que refleja fuerza, autenticidad y movimiento. No vestimos tendencias; vestimos actitud.
                        </p>
                        <p className={body}>
                            Fusionamos lo deportivo y lo urbano con piezas funcionales que se sienten como segunda piel.
                            Cada colección es una invitación a expresarte con confianza y romper lo establecido.
                        </p>
                        <p className={body}>
                            La moda es tu herramienta, y <span className="text-fuchsia-400 font-semibold">nosotros tu canvas</span>.
                            Explora. Experimenta. Evoluciona.
                        </p>

                        <div className="pt-2">
                            <Link to="/" onClick={() => window.scrollTo(0, 0)}>
                                <button className="rounded-full bg-fuchsia-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-fuchsia-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/60">
                                    Conocer Colecciones
                                </button>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Logo animado */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="flex w-full items-center justify-center md:w-1/2"
                    >
                        <div className="rounded-xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur-sm">
                            <img
                                src="/images/logo2unscreen.gif"
                                alt="Animación del logo MILVNNE"
                                loading="lazy"
                                decoding="async"
                                className="w-72 rounded-lg object-contain md:w-96 transition-transform duration-500 hover:scale-105"
                            />
                        </div>
                    </motion.div>
                </div>

                {/* Separador + highlights (misma info, mejor jerarquía visual) */}
                <div className="mx-auto mt-12 h-px max-w-7xl bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <div className="mx-auto mt-12 grid max-w-7xl grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <h3 className="text-lg font-semibold text-white">Fuerza & Autenticidad</h3>
                        <p className="mt-2 text-sm text-gray-300">Piezas funcionales que se sienten como segunda piel y proyectan identidad.</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                        <h3 className="text-lg font-semibold text-white">Movimiento & Actitud</h3>
                        <p className="mt-2 text-sm text-gray-300">Diseños que se mueven contigo para expresarte con confianza.</p>
                    </div>
                </div>
            </section>

            {/* ===== ACTITUD + CARDS ===== */}
            <section className={`${shell} relative overflow-hidden px-6 py-20 md:py-24`}>
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-12 md:flex-row">
                    {/* Texto */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="w-full md:w-1/2"
                    >
                        <h2 className={`${h2} mb-6 leading-tight`}>
                            MÁS QUE ROPA, <span className="text-fuchsia-400">UNA ACTITUD</span>
                        </h2>
                        <p className={`${body} mb-6 max-w-md`}>
                            En MILVNNE, el estilo es una declaración. Creamos piezas que se mueven contigo, que reflejan tu energía,
                            y que destacan tu individualidad. No sigues la moda. La rediseñas.
                        </p>
                        <Link to="/" onClick={() => window.scrollTo(0, 0)}>
                            <button className="rounded-full bg-fuchsia-500 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-fuchsia-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/60">
                                Ver Colecciones
                            </button>
                        </Link>
                    </motion.div>

                    {/* Cards (hover video desktop, botón play en mobile) */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.1 }}
                        className="flex w-full gap-6 overflow-x-auto pb-2 [scrollbar-width:thin] [scrollbar-color:theme(colors.fuchsia.500)_transparent] md:w-1/2"
                    >
                        {cards.map((item, i) => (
                            <article key={i} className="group relative h-80 w-60 shrink-0 overflow-hidden rounded-2xl shadow-lg">
                                <img
                                    src={item.src}
                                    alt={item.label}
                                    loading="lazy"
                                    decoding="async"
                                    className="h-full w-full object-cover"
                                />
                                <video
                                    src={item.video}
                                    muted
                                    loop
                                    playsInline
                                    preload="metadata"
                                    className="absolute inset-0 hidden h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:block"
                                    onMouseEnter={(e) => {
                                        const v = e.currentTarget;
                                        if (v.paused) { v.currentTime = 0; v.play().catch(() => { }); }
                                    }}
                                    onMouseLeave={(e) => {
                                        const v = e.currentTarget; v.pause(); v.currentTime = 0;
                                    }}
                                />
                                <button
                                    className="absolute bottom-3 right-3 block rounded bg-black/60 px-2 py-1 text-xs text-white md:hidden"
                                    onClick={(e) => { const v = e.currentTarget.previousSibling; try { v.play(); } catch { } }}
                                    aria-label="Reproducir video"
                                >
                                    ▶︎
                                </button>
                                <div className="absolute bottom-3 left-3 rounded-md bg-black/60 px-3 py-1 text-sm font-semibold">
                                    {item.label}
                                </div>
                            </article>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ===== STAY INSPIRED (slideshow) ===== */}
            <section className={`${shell} px-6 py-24 md:px-20`}>
                <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
                    {/* Texto */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="space-y-6 text-center lg:text-left"
                    >
                        <h2 className={`${h2}`}>Stay <span className="text-fuchsia-500">Inspired</span></h2>
                        <p className={body}>
                            Cada cabeza es un mundo. En <span className="text-fuchsia-400 font-semibold">MILVNNE</span> entendemos que la mente es nuestro canvas y la ropa una extensión de quiénes somos.
                            Nuestras piezas son un recordatorio visual de que lo único que necesitas para alcanzar lo que sueñas — eres tú mismo.
                        </p>
                        <p className="text-gray-400 italic">“MILVNNE es WRLWIDE desde que decidí que el mundo era mío.”</p>
                    </motion.div>

                    {/* Slideshow grande */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="relative h-[52svh] w-full overflow-hidden rounded-2xl shadow-2xl md:h-[60svh]"
                    >
                        {images.map((src, i) => (
                            <img
                                key={i}
                                src={src}
                                alt={`Inspiration ${i + 1}`}
                                loading="lazy"
                                decoding="async"
                                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${i === imageIndex ? 'opacity-100' : 'opacity-0'}`}
                            />
                        ))}
                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-6">
                            <p className="font-medium tracking-wide">Autenticidad en cada pieza.</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ===== UPR BG + GALERÍA ===== */}
            <section
                className="relative flex min-h-screen items-center justify-center bg-cover bg-center"
                style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/images/UPRRC.png)` }}
                aria-label="UPR Carolina x MILVNNE"
            >
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/90" />
                <div className="relative z-10 w-full max-w-7xl px-6 py-24 text-white">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="mb-12 text-center"
                    >
                        <h2 className="mb-4 text-[clamp(2.25rem,6vw,3.75rem)] font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-pink-500 to-fuchsia-400 drop-shadow-lg">
                            UNIFORMADOS DE ACTITUD
                        </h2>
                        <p className="mx-auto max-w-3xl text-lg font-light text-white/90">
                            La Universidad de Puerto Rico en Carolina corre con estilo propio. Esta colaboración con MILVNNE no es solo ropa, es una expresión visual de fuerza, identidad y movimiento.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:pb-0 snap-x snap-mandatory"
                    >
                        {[
                            '/images/upr1.png', '/images/upr2.png', '/images/upr3.png', '/images/upr4.png',
                            '/images/upr5.png', '/images/upr6.png', '/images/upr7.png', '/images/upr8.png',
                            '/images/upr9.png', '/images/upr10.png', '/images/upr11.png', '/images/upr12.png',
                        ].map((src, i) => (
                            <div
                                key={i}
                                className="group relative min-w-[72%] snap-center overflow-hidden rounded-3xl border border-white/10 shadow-2xl transition duration-500 hover:scale-[1.02] md:min-w-0"
                            >
                                <img
                                    src={src}
                                    alt={`Foto equipo ${i + 1}`}
                                    loading="lazy"
                                    decoding="async"
                                    className="h-80 w-full object-cover brightness-90 transition-all duration-500 group-hover:brightness-110"
                                />
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ===== PROYECTOS ===== */}
            <section className={`${shell} py-24 px-6`} aria-labelledby="projects-title">
                <div className="mx-auto max-w-7xl text-center">
                    <h2 id="projects-title" className={`${h2} mb-4 text-fuchsia-500`}>Proyectos & Colaboraciones</h2>
                    <p className="mx-auto mb-12 max-w-2xl text-lg text-gray-300">
                        Nos enorgullece colaborar con comunidades, equipos y eventos que comparten nuestra visión de autenticidad, fuerza y evolución constante.
                    </p>
                </div>

                <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {[0, 1, 2].map((idx) => (
                        <article key={idx} className="overflow-hidden rounded-xl border border-white/10 bg-white/5 shadow-xl transition-transform duration-300 hover:scale-[1.02]">
                            <div className="h-64 overflow-hidden">
                                <img
                                    src={idx === 1 ? '/images/Justas25.jpeg' : '/images/UPRRC.png'}
                                    alt="UPR Carolina"
                                    loading="lazy"
                                    decoding="async"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div className="space-y-3 p-6">
                                <h3 className="text-2xl font-bold text-fuchsia-400">UPR Carolina – Atletismo</h3>
                                <p className="text-sm text-gray-300">
                                    Auspiciamos al equipo de atletismo de la UPR Carolina con uniformes exclusivos y una edición especial de camisa para las Justas.
                                </p>
                                {justasShirtId && (
                                    <Link
                                        to={`/product/${justasShirtId}`}
                                        onClick={() => window.scrollTo(0, 0)}
                                        className="inline-block rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60"
                                    >
                                        Ver Camisa
                                    </Link>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            {/* ===== QUOTE + VIDEO ===== */}
            <section className={`${shell} flex flex-col items-center justify-between gap-12 px-8 py-20 md:flex-row`}>
                <div className="w-full space-y-6 md:w-1/2">
                    <blockquote className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-extrabold leading-snug tracking-tight text-fuchsia-400">
                        “La disciplina es el puente entre las metas y los logros.”
                    </blockquote>
                    <p className={`${body} max-w-md`}>
                        En MILVNNE, entendemos que tu actitud y disciplina son lo que transforma una prenda en una declaración.
                        Este es tu espacio, tu momento, tu evolución.
                    </p>
                </div>
                <div className="w-full md:w-1/2">
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-sm">
                        <video src="/images/videowaw.mov" controls className="h-full w-full object-cover" />
                    </div>
                </div>
            </section>

            {/* ===== FOOTER IG ===== */}
            <footer className={`${shell} py-24 px-6`}>
                <div className="mx-auto max-w-7xl space-y-10 text-center">
                    <div>
                        <h2 className="mb-3 text-[clamp(1.75rem,4.5vw,3rem)] font-extrabold tracking-tight">
                            Conecta con <span className="text-fuchsia-400">MILVNNE</span>
                        </h2>
                        <p className="mx-auto mb-6 max-w-2xl text-lg text-gray-300">
                            Sigue nuestro movimiento en Instagram y descubre contenido exclusivo, lanzamientos, colaboraciones y más.
                        </p>
                        <a
                            href="https://www.instagram.com/milvnne.studios/?hl=es"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block rounded-full bg-fuchsia-600 px-8 py-4 font-semibold text-white shadow-lg transition hover:bg-fuchsia-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/60"
                        >
                            Síguenos en Instagram
                        </a>
                    </div>

                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
                        {['/images/Justas25.jpeg', '/images/Worldwide.jpg', '/images/comfy.png', '/images/running.png'].map((src, i) => (
                            <div key={i} className="group relative overflow-hidden rounded-xl border border-white/10 shadow-xl">
                                <img
                                    src={src}
                                    alt={`Instagram Post ${i + 1}`}
                                    loading="lazy"
                                    decoding="async"
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                                    <span className="text-sm font-semibold">Ver más</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-white/15 pt-6 text-sm text-gray-400">
                        © {new Date().getFullYear()} MILVNNE STUDIOS — Todos los derechos reservados
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Hero;
