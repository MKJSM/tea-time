
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowUp } from 'lucide-react';

// Images
import heroImage from '../assets/mobilitea-hero.png';
import logoImage from '../assets/mobilitea-logo.png';
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
        { icon: qualityIcon, title: "Quality First", desc: "Premium beverages for a premium experience." },
        { icon: customerIcon, title: "Customer-Centricity", desc: "Tailored to your team's unique needs." },
        { icon: sustainabilityIcon, title: "Sustainability", desc: "Eco-friendly choices for a greener tomorrow." },
        { icon: innovationIcon, title: "Innovation", desc: "Smart tracking and seamless service." },
        { icon: consistentIcon, title: "Consistency", desc: "Reliable refreshment, every single day." },
        { icon: integrityIcon, title: "Integrity", desc: "Transparent pricing and honest service." }
    ];

    return (
        <div className="min-h-screen bg-stone-50 text-stone-800 font-sans pb-24">

            {/* Hero Section */}
            <div className="relative h-[80vh] w-full overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src={heroImage}
                        alt="Modern Corporate Breakroom"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-stone-900/90" />
                </div>

                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
                    <motion.img
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        src={logoImage}
                        alt="Mobilitea Logo"
                        className="w-24 h-24 mb-6 drop-shadow-lg"
                    />
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight"
                    >
                        Redefining Workplace <br /> Refreshment
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-lg md:text-xl text-stone-200 max-w-2xl font-light"
                    >
                        Elevating the corporate breakroom experience with premium tea, coffee, and sustainable service.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="absolute bottom-10 animate-bounce"
                    >
                        <ChevronDown className="text-white w-8 h-8" />
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
                {/* Vision & Mission */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-24">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-white p-8 rounded-2xl shadow-xl border-l-4 border-tea-600 flex flex-col items-start"
                    >
                        <div className="text-4xl mb-4">🌿</div>
                        <h3 className="text-2xl font-bold text-stone-900 mb-3">Our Vision</h3>
                        <p className="text-stone-600 leading-relaxed">
                            To transform every workplace into a hub of vitality and connection, one cup at a time.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-white p-8 rounded-2xl shadow-xl border-l-4 border-amber-500 flex flex-col items-start"
                    >
                        <div className="text-4xl mb-4">🎯</div>
                        <h3 className="text-2xl font-bold text-stone-900 mb-3">Our Mission</h3>
                        <p className="text-stone-600 leading-relaxed">
                            Deliver consistent, high-quality refreshment solutions that empower professionals and promote sustainable wellness.
                        </p>
                    </motion.div>
                </div>

                {/* Values Section */}
                <div className="mb-24">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-stone-800 mb-4">Our Core Values</h2>
                        <div className="w-20 h-1 bg-tea-500 mx-auto rounded-full" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        {values.map((val, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col items-center text-center"
                            >
                                <div className="w-20 h-20 mb-4 bg-stone-50 rounded-full p-4 flex items-center justify-center">
                                    <img src={val.icon} alt={val.title} className="w-full h-full object-contain" />
                                </div>
                                <h4 className="font-bold text-stone-900 mb-2">{val.title}</h4>
                                <p className="text-sm text-stone-500">{val.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Core Competencies */}
                <div className="bg-white rounded-[3rem] p-8 md:p-16 shadow-2xl mb-20 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-tea-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-50 rounded-full mix-blend-multiply filter blur-3xl opacity-70 translate-y-1/2 -translate-x-1/2" />

                    <div className="relative z-10">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-stone-800 mb-4">The Mobilitea Ecosystem</h2>
                            <p className="text-stone-600 max-w-2xl mx-auto">
                                From organic sourcing to your desk, we handle every step with precision and care.
                            </p>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-12">
                            {/* Illustration */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                className="w-full md:w-1/2"
                            >
                                <img src={coreCompImage} alt="Mobilitea Ecosystem" className="w-full h-auto rounded-xl shadow-lg" />
                            </motion.div>

                            {/* Accordion / List */}
                            <div className="w-full md:w-1/2 space-y-4">
                                {[
                                    { title: "Smart Ordering", text: "Seamless mobile app experience for instant requests." },
                                    { title: "Fresh Preparation", text: "Beverages brewed fresh with premium ingredients." },
                                    { title: "Thermosteel Delivery", text: "Temperature retained for hours in eco-friendly flasks." },
                                    { title: "Zero-Waste Cycle", text: "We collect, sanitize, and reuse flasks daily." }
                                ].map((item, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: 20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="bg-stone-50 hover:bg-tea-50 p-6 rounded-xl transition-colors cursor-default"
                                    >
                                        <h4 className="font-bold text-tea-900 text-lg mb-1">{item.title}</h4>
                                        <p className="text-stone-600">{item.text}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Back to Top */}
            <AnimatePresence>
                {showBackToTop && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        onClick={scrollToTop}
                        className="fixed bottom-24 right-6 bg-tea-600 text-white p-3 rounded-full shadow-lg hover:bg-tea-700 z-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-tea-500"
                        aria-label="Back to top"
                    >
                        <ArrowUp size={24} />
                    </motion.button>
                )}
            </AnimatePresence>

        </div>
    );
};

export default AboutPage;
