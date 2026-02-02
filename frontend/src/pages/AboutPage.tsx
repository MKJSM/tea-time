
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowRight } from 'lucide-react';

// Images
import heroImage from '../assets/mobilitea-hero.png';
import qualityIcon from '../assets/values-quality.png';
import customerIcon from '../assets/values-customer.png';
import sustainabilityIcon from '../assets/values-sustainability.png';
import innovationIcon from '../assets/values-innovation.png';
import consistentIcon from '../assets/values-consistent.png';
import integrityIcon from '../assets/values-integrity.png';
import coreCompImage from '../assets/core-competencies.png';

const AboutPage: React.FC = () => {
    const [showBackToTop, setShowBackToTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 400) {
                setShowBackToTop(true);
            } else {
                setShowBackToTop(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const values = [
        { icon: qualityIcon, title: "Uncompromised Quality", desc: "Sourcing only the finest leaves from high-elevation estates.", colSpan: "md:col-span-2", bg: "bg-stone-50" },
        { icon: sustainabilityIcon, title: "Zero Waste", desc: "A completely circular ecosystem.", colSpan: "md:col-span-1", bg: "bg-tea-50" },
        { icon: customerIcon, title: "You-Centric", desc: "Tailored to your team.", colSpan: "md:col-span-1", bg: "bg-amber-50" },
        { icon: innovationIcon, title: "Tech-Forward", desc: "Seamless app ordering.", colSpan: "md:col-span-2", bg: "bg-stone-50" },
        { icon: consistentIcon, title: "Reliability", desc: "Every cup, perfect.", colSpan: "md:col-span-1", bg: "bg-stone-100" },
        { icon: integrityIcon, title: "Integrity", desc: "Honest, transparent pricing.", colSpan: "md:col-span-1", bg: "bg-stone-50" }
    ];

    return (
        <div className="min-h-screen bg-stone-50 text-stone-900 font-sans overflow-x-hidden">

            {/* 1. Asymmetric Split Hero */}
            <section className="relative min-h-[90vh] flex flex-col lg:flex-row bg-tea-900">
                <div className="lg:w-[40%] p-10 lg:p-20 flex flex-col justify-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    >
                        <div className="w-16 h-1 bg-amber-400 mb-8" />
                        <h1 className="text-5xl md:text-7xl font-serif text-white leading-none mb-6">
                            Pouring <br /> <span className="text-amber-400 italic">Vitality</span> <br /> Into Work.
                        </h1>
                        <p className="text-tea-100 text-lg md:text-xl font-light leading-relaxed mb-10 max-w-md">
                            Mobilitea isn't just a service. It's the modern tea house, reimagined for the corporate world.
                        </p>
                        <button className="flex items-center gap-3 text-white border-b border-amber-400 pb-1 hover:text-amber-400 transition-colors group">
                            <span>Explore Our Story</span>
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </motion.div>
                </div>

                <div className="lg:w-[60%] relative h-[50vh] lg:h-auto overflow-hidden">
                    <motion.div
                        initial={{ scale: 1.2, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="absolute inset-0 lg:m-4 rounded-[0px] lg:rounded-[2rem] overflow-hidden"
                    >
                        <img src={heroImage} alt="Tea Service" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/10" />
                    </motion.div>

                    {/* Floating Badge */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.8 }}
                        className="absolute bottom-10 left-10 lg:left-20 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-white max-w-xs hidden lg:block"
                    >
                        <p className="font-serif text-lg italic">"The most refreshing part of our day."</p>
                        <p className="text-xs uppercase tracking-widest mt-2 text-amber-400">— Partner Since 2024</p>
                    </motion.div>
                </div>
            </section>

            {/* 2. Glass Cards Narrative */}
            <section className="py-32 px-6 relative bg-[#EBE9E4]">
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#444_1px,transparent_1px)] [background-size:16px_16px]" />

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start relative z-10">
                    <div className="lg:sticky lg:top-32">
                        <h2 className="text-4xl md:text-6xl font-serif text-stone-900 mb-6">Designed for <br /> <span className="text-tea-700">Peace of Mind.</span></h2>
                        <p className="text-lg text-stone-600 leading-relaxed max-w-md">
                            We believe the breakroom should be a sanctuary. A place where noise fades, and clarity returns with every sip.
                        </p>
                    </div>

                    <div className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-sm border border-white/40"
                        >
                            <div className="w-12 h-12 bg-tea-100 rounded-full flex items-center justify-center mb-6 text-2xl">🌱</div>
                            <h3 className="text-2xl font-bold mb-3">Rooted in Nature</h3>
                            <p className="text-stone-600">Our leaves are hand-picked from biodiversity-friendly estates, ensuring that nature's complex flavors are preserved in every brew.</p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/80 backdrop-blur-xl p-10 rounded-3xl shadow-sm border border-white/40"
                        >
                            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-6 text-2xl">⚡</div>
                            <h3 className="text-2xl font-bold mb-3">Powered by Tech</h3>
                            <p className="text-stone-600">With real-time tracking and predictive ordering, we ensure your pantry is never empty, and your team is never thirsty.</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* 3. Bento Grid Values */}
            <section className="py-32 px-6 bg-stone-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <h2 className="text-4xl font-serif font-bold text-stone-900 mb-4">The Mobilitea Difference</h2>
                        <p className="text-stone-500">Six pillars that define our commitment to excellence.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {values.map((val, idx) => (
                            <motion.div
                                key={idx}
                                className={`${val.colSpan} ${val.bg} p-8 rounded-[2rem] hover:shadow-xl transition-all duration-300 group flex flex-col justify-between min-h-[240px] border border-black/5`}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                            >
                                <div className="w-14 h-14 p-3 bg-white rounded-2xl shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                    <img src={val.icon} alt={val.title} className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-stone-900 mb-2">{val.title}</h3>
                                    <p className="text-stone-500 text-sm leading-relaxed">{val.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 4. Dark Ecosystem Section */}
            <section className="bg-[#1a1a18] py-32 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-tea-900/30 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <div>
                            <span className="text-amber-400 font-bold tracking-widest uppercase text-sm">Full Circle</span>
                            <h2 className="text-5xl font-serif mt-4 mb-8">The Infinite Loop.</h2>
                            <p className="text-stone-400 text-lg leading-relaxed mb-12">
                                We've closed the gap between convenience and sustainability. Our end-to-end model ensures that nothing goes to waste—except the stress of the workday.
                            </p>

                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <h4 className="text-3xl font-bold text-white mb-2">100%</h4>
                                    <p className="text-stone-500 text-sm">Reusable Flasks</p>
                                </div>
                                <div>
                                    <h4 className="text-3xl font-bold text-white mb-2">Zero</h4>
                                    <p className="text-stone-500 text-sm">Paper Waste</p>
                                </div>
                            </div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, rotate: -5 }}
                            whileInView={{ opacity: 1, rotate: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                            className="bg-white/5 p-10 rounded-full backdrop-blur-sm border border-white/10"
                        >
                            <img src={coreCompImage} alt="Ecosystem" className="w-full h-auto drop-shadow-2xl opacity-90 invert-[.05]" />
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Back to Top */}
            <AnimatePresence>
                {showBackToTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        onClick={scrollToTop}
                        className="fixed bottom-8 right-8 w-14 h-14 bg-amber-400 text-tea-900 flex items-center justify-center rounded-full shadow-lg hover:bg-white transition-colors z-50 font-bold"
                    >
                        <ArrowUp size={24} />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AboutPage;
