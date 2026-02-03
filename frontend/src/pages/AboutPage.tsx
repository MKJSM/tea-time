import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { ChevronDown, ArrowRight } from 'lucide-react';

// Assets
import heroBg from '../assets/premium-hero.png';
import qualityIcon from '../assets/icon-quality.png';
import customerIcon from '../assets/icon-customer.png';
import sustainabilityIcon from '../assets/icon-sustainability.png';
import innovationIcon from '../assets/icon-innovation.png';
import consistencyIcon from '../assets/icon-consistency.png';
import integrityIcon from '../assets/icon-integrity.png';
import ecoInfographic from '../assets/infographic-ecosystem.png';

const AboutPage: React.FC = () => {
    // Scroll for parallax
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 500], [0, 200]);

    // Typing effect state
    const taglineText = "Redefining Workplace Refreshment";
    const [typedText, setTypedText] = useState("");
    const [showCursor, setShowCursor] = useState(true);

    // Expansion states for cards
    const [expandedCard, setExpandedCard] = useState<string | null>(null);

    // Typing effect logic
    useEffect(() => {
        let i = 0;
        const typingInterval = setInterval(() => {
            if (i < taglineText.length) {
                setTypedText(taglineText.substring(0, i + 1));
                i++;
            } else {
                clearInterval(typingInterval);
            }
        }, 80);

        const cursorInterval = setInterval(() => {
            setShowCursor((prev) => !prev);
        }, 500);

        return () => {
            clearInterval(typingInterval);
            clearInterval(cursorInterval);
        };
    }, []);

    const values = [
        { id: 'quality', icon: qualityIcon, title: "Quality First", short: "Sourcing finest leaves.", full: "We obsessively source premium leaves from high-elevation estates, ensuring every cup delivers complex, authentic flavor profiles." },
        { id: 'customer', icon: customerIcon, title: "Customer-Centric", short: "Tailored to you.", full: "Your team's preferences drive our service. From custom blends to personalized delivery schedules, we adapt to your workflow." },
        { id: 'sustainability', icon: sustainabilityIcon, title: "Sustainability", short: "Zero waste cycle.", full: "Our circular ecosystem eliminates single-use cups. Reusable flasks, electric delivery fleet, and responsible sourcing." },
        { id: 'innovation', icon: innovationIcon, title: "Innovation", short: "Smart ordering.", full: "Seamless app integration allows for predictive ordering and real-time tracking, bringing the tea ceremony into the digital age." },
        { id: 'consistency', icon: consistencyIcon, title: "Consistency", short: "Perfect every time.", full: "Standardized brewing protocols and thermal technology guarantee that the 100th cup tastes exactly as perfect as the first." },
        { id: 'integrity', icon: integrityIcon, title: "Integrity", short: "Honest pricing.", full: "Transparent pricing models and ethical supply chains. We believe in doing good while brewing good." },
    ];

    const toggleCard = (id: string) => {
        setExpandedCard(expandedCard === id ? null : id);
    };

    return (
        <div className="min-h-screen bg-cream font-sans text-warm-grey-700 overflow-x-hidden selection:bg-tea-sage selection:text-white">

            {/* 2. Deep Luxury Hero */}
            <section className="relative min-h-screen flex flex-col lg:flex-row bg-tea-900 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-10 pointer-events-none">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-tea-500 rounded-full blur-[120px]" />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-amber-glow rounded-full blur-[100px]" />
                </div>

                {/* Left Content */}
                <div className="relative z-10 w-full lg:w-1/2 flex flex-col justify-center px-6 lg:px-20 pt-32 lg:pt-0">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <span className="h-[1px] w-12 bg-amber-glow"></span>
                            <span className="text-amber-glow font-mono uppercase tracking-widest text-xs">Est. 2024</span>
                        </div>

                        <h1 className="text-6xl md:text-8xl font-serif text-cream-white leading-[0.9] mb-8">
                            Mobili<span className="italic text-tea-300">tea</span>
                        </h1>

                        <div className="h-20 overflow-hidden mb-10">
                            <p className="text-xl md:text-2xl font-light text-tea-100/80 font-sans max-w-md leading-relaxed">
                                {typedText}
                                <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} text-amber-glow`}>|</span>
                            </p>
                        </div>

                        <div className="flex gap-6">
                            <button className="px-8 py-4 bg-amber-glow text-tea-900 font-bold rounded-full hover:bg-white transition-colors">
                                Our Story
                            </button>
                            <button className="flex items-center gap-2 text-white px-8 py-4 hover:text-amber-glow transition-colors group">
                                View Menu <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </motion.div>
                </div>

                {/* Right Visual - Arch Mask */}
                <div className="relative w-full lg:w-1/2 h-[50vh] lg:h-screen flex items-end justify-center lg:justify-end lg:pr-20 lg:pb-20">
                    <motion.div
                        initial={{ height: "0%" }}
                        animate={{ height: "85%" }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                        className="relative w-full max-w-md lg:max-w-xl bg-tea-800 rounded-t-[10rem] overflow-hidden shadow-2xl shadow-black/50"
                    >
                        <motion.img
                            style={{ scale: 1.1, y: heroY }}
                            src={heroBg}
                            alt="Premium Tea"
                            className="w-full h-full object-cover opacity-90"
                        />

                        {/* Floating Glass Stat */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1, duration: 0.8 }}
                            className="absolute bottom-8 left-8 right-8 bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-white"
                        >
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-tea-200 uppercase tracking-wider mb-1">Daily Brews</p>
                                    <p className="text-3xl font-serif">10,000+</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-tea-200 uppercase tracking-wider mb-1">Satisfaction</p>
                                    <p className="text-3xl font-serif text-amber-glow">99.8%</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* 3. Story Section (Vision & Mission) */}
            <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                    {/* Vision Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8 }}
                        className="glass p-8 md:p-12 rounded-[2rem] shadow-tea-glow hover:shadow-lg transition-all duration-300 group cursor-pointer"
                    >
                        <div className="w-16 h-16 bg-tea-mint/30 rounded-full flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform">🌿</div>
                        <h2 className="text-3xl font-serif text-charcoal-900 mb-4 flex items-center gap-3">
                            Our Vision <span className="w-8 h-[1px] bg-tea-sage/30 block" />
                        </h2>
                        <p className="text-lg leading-relaxed text-warm-grey-700">
                            To transform the corporate break from a mundane necessity into a moment of genuine restoration. We envision a world where every sip reconnects you to nature and yourself.
                        </p>
                    </motion.div>

                    {/* Mission Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="glass p-8 md:p-12 rounded-[2rem] shadow-tea-glow hover:shadow-lg transition-all duration-300 group cursor-pointer"
                    >
                        <div className="w-16 h-16 bg-amber-glow/10 rounded-full flex items-center justify-center mb-6 text-3xl group-hover:scale-110 transition-transform">🎯</div>
                        <h2 className="text-3xl font-serif text-charcoal-900 mb-4 flex items-center gap-3">
                            Our Mission <span className="w-8 h-[1px] bg-amber-glow/30 block" />
                        </h2>
                        <p className="text-lg leading-relaxed text-warm-grey-700">
                            Delivering premium, sustainable refreshment through smart technology and human-centric service. We bridge the gap between artisanal quality and operational efficiency.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* 4. Values Grid */}
            <section className="py-24 px-4 bg-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-tea-sage/20 to-transparent" />

                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16"
                    >
                        <span className="text-tea-sage font-mono uppercase tracking-widest text-sm">The Mobilitea Way</span>
                        <h2 className="text-4xl md:text-5xl font-serif text-charcoal-900 mt-4">Core Values</h2>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 justify-items-center">
                        {values.map((val, idx) => (
                            <motion.div
                                key={val.id}
                                layout
                                onClick={() => toggleCard(val.id)}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className={`
                                    relative bg-warm-grey-100 rounded-3xl p-8 w-full max-w-sm cursor-pointer overflow-hidden
                                    border border-black/5 hover:border-tea-sage/30 hover:shadow-md transition-all duration-500
                                    ${expandedCard === val.id ? 'shadow-lg ring-1 ring-tea-sage bg-white' : ''}
                                `}
                            >
                                <motion.div layout="position" className="flex items-center gap-4 mb-4">
                                    <div className="w-12 h-12 bg-white rounded-xl p-2 shadow-sm shrink-0">
                                        <img src={val.icon} alt={val.title} className="w-full h-full object-contain" />
                                    </div>
                                    <h3 className="text-xl font-bold text-charcoal-900">{val.title}</h3>
                                </motion.div>

                                <motion.p layout="position" className="text-tea-forest font-medium">
                                    {val.short}
                                </motion.p>

                                <AnimatePresence>
                                    {expandedCard === val.id && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-4 pt-4 border-t border-tea-sage/10"
                                        >
                                            <p className="text-warm-grey-700 text-sm leading-relaxed">
                                                {val.full}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Simple interactive hint */}
                                <div className={`absolute top-4 right-4 text-tea-sage/50 transition-transform duration-300 ${expandedCard === val.id ? 'rotate-180' : ''}`}>
                                    <ChevronDown size={20} />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. Competencies / Ecosystem */}
            <section className="py-24 bg-tea-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-tea-800 via-tea-900 to-black opacity-50" />

                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div>
                        <span className="text-amber-glow font-mono uppercase tracking-widest text-sm">Full Cycle</span>
                        <h2 className="text-4xl md:text-6xl font-serif mt-4 mb-8 leading-tight text-white">
                            The Infinite <br /> <span className="text-tea-300 italic">Loop.</span>
                        </h2>
                        <ul className="space-y-8 mt-12">
                            {[
                                { title: "Smart Order", desc: "Predictive AI ensures you never run out." },
                                { title: "Precision Brew", desc: "Thermosteel flasks keep it perfect." },
                                { title: "Zero Waste Return", desc: "We collect, clean, and reuse. 100%." }
                            ].map((item, i) => (
                                <motion.li
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.2 }}
                                    className="flex gap-6 items-start group"
                                >
                                    <span className="font-mono text-tea-400 text-sm mt-1">0{i + 1}</span>
                                    <div>
                                        <h4 className="text-xl font-bold group-hover:text-amber-glow transition-colors">{item.title}</h4>
                                        <p className="text-tea-100/60 font-light mt-1">{item.desc}</p>
                                    </div>
                                </motion.li>
                            ))}
                        </ul>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
                        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1 }}
                        className="relative"
                    >
                        <div className="absolute -inset-10 bg-tea-500/20 blur-3xl rounded-full" />
                        <img src={ecoInfographic} alt="Ecosystem" className="relative w-full h-auto drop-shadow-2xl" />
                    </motion.div>
                </div>
            </section>

            {/* Footer / CTA */}
            <section className="py-24 px-6 text-center bg-cream-white">
                <div className="max-w-2xl mx-auto">
                    <h2 className="text-4xl font-serif text-charcoal-900 mb-8">Ready to elevate your breakroom?</h2>
                    <button className="bg-tea-forest text-white px-10 py-5 rounded-full text-lg font-bold shadow-lg shadow-tea-glow hover:scale-105 hover:bg-tea-800 transition-all duration-300">
                        Experience Mobilitea
                    </button>
                    <p className="mt-8 text-sm text-warm-grey-300"> Trusted by 500+ Corporate Offices </p>
                </div>
            </section>

        </div>
    );
};

export default AboutPage;
