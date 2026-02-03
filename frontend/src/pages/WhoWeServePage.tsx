import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
    Building2, ShoppingBag, HeartPulse, Landmark, GraduationCap,
    Store, PartyPopper, Factory, Users, ChevronDown, ArrowRight, Check
} from 'lucide-react';
import heroBg from '../assets/premium-hero.png'; // Fallback until collage is generated

const sectors = [
    {
        id: 'corporate',
        title: "Corporate Offices & IT Parks",
        desc: "Daily tea, coffee, and refreshment solutions for teams of all sizes.",
        icon: Building2,
        color: "text-corporate-blue",
        bgTint: "bg-corporate-blue/5",
        border: "border-corporate-blue",
        shadow: "shadow-corporate-blue/20",
        details: ["Flexible team sizes (5-500+)", "Scheduled daily delivery", "Customizable preferences", "Premium thermosteel flasks"]
    },
    {
        id: 'retail',
        title: "Shops & Retail Outlets",
        desc: "Keep your sales team refreshed and energetic during peak hours.",
        icon: Store,
        color: "text-retail-orange",
        bgTint: "bg-retail-orange/5",
        border: "border-retail-orange",
        shadow: "shadow-retail-orange/20",
        details: ["Consistent staff refreshment", "Flexible delivery schedules", "Bulk ordering options", "Quick replenishment"]
    },
    {
        id: 'health',
        title: "Hospitals & Healthcare",
        desc: "Hygienic, contactless delivery for doctors, nurses, and support staff.",
        icon: HeartPulse,
        color: "text-health-teal",
        bgTint: "bg-health-teal/5",
        border: "border-health-teal",
        shadow: "shadow-health-teal/20",
        details: ["Hygienic contactless delivery", "24/7 shift availability", "Healthcare standard compliant", "Temperature controlled"]
    },
    {
        id: 'gov',
        title: "Government Offices",
        desc: "Punctual, compliant service for official institutions and departments.",
        icon: Landmark,
        color: "text-gov-burgundy",
        bgTint: "bg-gov-burgundy/5",
        border: "border-gov-burgundy",
        shadow: "shadow-gov-burgundy/20",
        details: ["Punctual time-stamped delivery", "Standardized quality assurance", "Protocol compliant", "Documentation support"]
    },
    {
        id: 'edu',
        title: "Educational Institutions",
        desc: "Nutritious options for faculty rooms, events, and student gatherings.",
        icon: GraduationCap,
        color: "text-edu-purple",
        bgTint: "bg-edu-purple/5",
        border: "border-edu-purple",
        shadow: "shadow-edu-purple/20",
        details: ["Staff room service", "Event catering", "Semester-based contracts", "Budget-friendly packages"]
    },
    {
        id: 'commercial',
        title: "Malls & Commercial",
        desc: "Centralized refreshment management for complexes and food courts.",
        icon: ShoppingBag,
        color: "text-commercial-magenta",
        bgTint: "bg-commercial-magenta/5",
        border: "border-commercial-magenta",
        shadow: "shadow-commercial-magenta/20",
        details: ["Bulk multi-outlet delivery", "Centralized billing", "Weekend availability", "Tenant-specific packages"]
    },
    {
        id: 'event',
        title: "Events & Gatherings",
        desc: "Premium catering for product launches, conferences, and seminars.",
        icon: PartyPopper,
        color: "text-event-gold",
        bgTint: "bg-event-gold/5",
        border: "border-event-gold",
        shadow: "shadow-event-gold/20",
        details: ["Conference catering", "On-demand booking", "Customizable menus", "Special dietary options"]
    },
    {
        id: 'industrial',
        title: "Factories & Industrial",
        desc: "Robust, large-volume service for shift-based workforce needs.",
        icon: Factory,
        color: "text-industrial-steel",
        bgTint: "bg-industrial-steel/5",
        border: "border-industrial-steel",
        shadow: "shadow-industrial-steel/20",
        details: ["Large volume (100+)", "Shift-based timings", "Multiple delivery points", "Industrial-grade packaging"]
    },
    {
        id: 'cowork',
        title: "Co-working Spaces",
        desc: "Flexible, app-based ordering for dynamic modern workspaces.",
        icon: Users,
        color: "text-cowork-lime",
        bgTint: "bg-cowork-lime/5",
        border: "border-cowork-lime",
        shadow: "shadow-cowork-lime/20",
        details: ["Flexible dynamic plans", "Per-desk/member billing", "Premium amenity service", "Digital-first management"]
    }
];

const WhoWeServePage: React.FC = () => {
    const [expandedIds, setExpandedIds] = useState<string[]>([]);

    // Parallax & Scroll Animations
    const { scrollY } = useScroll();
    const heroOpacity = useTransform(scrollY, [0, 300], [1, 0]);
    const heroY = useTransform(scrollY, [0, 500], [0, 150]);

    const toggleCard = (id: string) => {
        setExpandedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    return (
        <div className="min-h-screen bg-cream-white font-sans text-charcoal-900 selection:bg-tea-sage selection:text-white">

            {/* 1. HERO SECTION */}
            <section className="relative min-h-[90vh] flex flex-col items-center justify-center overflow-hidden py-20">
                {/* Background (Placeholder for collage) */}
                <motion.div
                    style={{ y: heroY, opacity: heroOpacity }}
                    className="absolute inset-0 z-0"
                >
                    {/* Increased opacity and reduced blur for better visibility */}
                    <img src={heroBg} alt="Workplace Collage" className="w-full h-full object-cover opacity-90 blur-[1px] scale-105" />
                    {/* Lighter gradient to let image show through */}
                    <div className="absolute inset-0 bg-gradient-to-b from-cream-white/10 via-cream-white/30 to-cream-white/90" />
                </motion.div>

                <div className="relative z-10 text-center px-4 max-w-5xl mx-auto flex flex-col flex-grow justify-center h-full w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="my-auto"
                    >
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-tea-forest mb-6 tracking-tight leading-none drop-shadow-sm">
                            WHO WE SERVE
                        </h1>
                        <p className="text-xl md:text-2xl text-charcoal-900 font-medium max-w-2xl mx-auto leading-relaxed">
                            One Service. <span className="font-serif italic text-tea-forest">Infinite Workplaces.</span>
                        </p>
                    </motion.div>

                    {/* Scroll Indicator - Flow layout to prevent overlap */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="mt-12 pb-8 flex flex-col items-center gap-2 text-tea-forest/90"
                    >
                        <span className="text-xs uppercase tracking-widest font-bold">Explore</span>
                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        >
                            <ChevronDown size={28} />
                        </motion.div>
                    </motion.div>
                </div>
            </section>


            {/* 2. INTRODUCTION STRIP */}
            <section className="py-16 px-6 text-center max-w-4xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6 }}
                >
                    <p className="text-2xl md:text-3xl font-serif text-charcoal-900 leading-snug">
                        From corporate boardrooms to bustling factory floors,
                        <span className="text-tea-sage italic"> Mobilitea</span> adapts to your rhythm.
                    </p>
                    <div className="mt-8 flex justify-center gap-8 text-warm-grey-700 font-mono text-sm tracking-widest uppercase">
                        <div>
                            <span className="block text-3xl font-serif font-bold text-tea-forest mb-1">9+</span>
                            Industries
                        </div>
                        <div className="w-[1px] bg-tea-sage/30" />
                        <div>
                            <span className="block text-3xl font-serif font-bold text-tea-forest mb-1">500+</span>
                            Partners
                        </div>
                    </div>
                </motion.div>
            </section>


            {/* 3. SECTOR GRID */}
            <section className="py-16 px-4 md:px-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sectors.map((sector, idx) => (
                        <motion.div
                            key={sector.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: idx * 0.05 }}
                            onClick={() => toggleCard(sector.id)}
                            className={`
                                relative p-8 rounded-3xl cursor-pointer overflow-hidden transition-all duration-300 group
                                bg-white border border-transparent shadow-sm hover:shadow-lg hover:-translate-y-1
                                ${expandedIds.includes(sector.id) ? `ring-2 ${sector.border} shadow-xl` : 'hover:border-warm-grey-300'}
                            `}
                        >
                            {/* Hover/Active tint background */}
                            <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 ${sector.bgTint} ${expandedIds.includes(sector.id) ? 'opacity-100' : 'group-hover:opacity-50'}`} />

                            <div className="relative z-10">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300 ${sector.bgTint} ${sector.color}`}>
                                    <sector.icon size={28} strokeWidth={1.5} />
                                </div>

                                <h3 className="text-xl font-bold font-serif mb-3 text-charcoal-900">{sector.title}</h3>
                                <p className="text-warm-grey-700 leading-relaxed mb-4">{sector.desc}</p>

                                <AnimatePresence>
                                    {expandedIds.includes(sector.id) && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className={`h-[1px] w-full bg-current opacity-10 my-4 ${sector.color}`} />
                                            <ul className="space-y-3">
                                                {sector.details.map((detail, i) => (
                                                    <motion.li
                                                        key={i}
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        transition={{ delay: i * 0.1 }}
                                                        className="flex items-start gap-3 text-sm text-warm-grey-700"
                                                    >
                                                        <Check size={16} className={`mt-0.5 shrink-0 ${sector.color}`} />
                                                        {detail}
                                                    </motion.li>
                                                ))}
                                            </ul>
                                            <button className={`mt-6 w-full py-3 rounded-xl font-bold text-sm bg-white border shadow-sm transition-transform active:scale-95 ${sector.border} ${sector.color}`}>
                                                Map Your Plan
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>


            {/* 4. CLOSING SECTION */}
            <section className="py-32 px-6 text-center bg-gradient-to-b from-cream-white to-tea-sage/10 relative overflow-hidden">
                <div className="max-w-3xl mx-auto relative z-10">
                    <span className="text-tea-sage font-mono uppercase tracking-widest text-sm mb-4 block">In Short</span>
                    <h2 className="text-3xl md:text-5xl font-serif text-charcoal-900 mb-8 leading-tight">
                        We deliver to any workplace that values <span className="text-tea-forest">quality, hygiene, and consistency.</span>
                    </h2>

                    <div className="flex items-center justify-center gap-4 text-2xl md:text-4xl font-bold font-serif text-amber-glow my-12">
                        <span>Sip.</span>
                        <span className="w-2 h-2 rounded-full bg-tea-sage" />
                        <span>Energize.</span>
                        <span className="w-2 h-2 rounded-full bg-tea-sage" />
                        <span>Repeat.</span>
                    </div>

                    <button className="group relative inline-flex items-center gap-3 px-10 py-5 bg-tea-forest text-white rounded-full text-lg font-bold shadow-lg shadow-tea-forest/30 hover:shadow-xl hover:scale-105 transition-all duration-300">
                        Find Your Perfect Plan
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>

                    <p className="mt-8 text-tea-forest/60 text-sm">Or <a href="#" className="underline decoration-tea-sage underline-offset-4 hover:text-tea-forest">contact sales</a> for a custom quote.</p>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-1/2 left-10 w-64 h-64 bg-tea-sage/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-10 w-96 h-96 bg-amber-glow/5 rounded-full blur-3xl" />
            </section>

        </div>
    );
};

export default WhoWeServePage;
