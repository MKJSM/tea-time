import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Award, Users, Globe, Recycle, Heart } from 'lucide-react';

const AboutPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-cream-paper pb-20">
            {/* Hero Section */}
            <div className="relative h-[60vh] overflow-hidden">
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=2070&auto=format&fit=crop"
                        alt="Tea Plantation"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
                </div>
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white backdrop-blur-md border border-white/20 mb-6">
                            <Leaf size={14} className="text-tea-300" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Our Philosophy</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6">Crafting Serenity</h1>
                        <p className="text-lg md:text-xl text-tea-100 max-w-2xl mx-auto font-light leading-relaxed">
                            We believe every cup tells a story. A story of mist-covered mountains, artisanal dedication, and the timeless ritual of pausing to breathe.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
                {/* Values Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { icon: Globe, title: "Global Sourcing", desc: "Hand-picked leaves from the world's most renowned estates." },
                        { icon: Recycle, title: "Sustainability", desc: "100% biodegradable packaging and ethical trade practices." },
                        { icon: Users, title: "Community", desc: "Supporting local farmers and artisans with fair wages." }
                    ].map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col items-center text-center group hover:bg-tea-50 transition-colors"
                        >
                            <div className="w-16 h-16 bg-tea-100 text-tea-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <item.icon size={32} />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-tea-900 mb-2">{item.title}</h3>
                            <p className="text-gray-500 font-medium leading-relaxed">{item.desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Story Section */}
                <div className="mt-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="order-2 lg:order-1">
                        <div className="relative">
                            <div className="absolute -inset-4 bg-tea-100 rounded-[3rem] -rotate-2" />
                            <img
                                src="https://images.unsplash.com/photo-1576092768241-dec231854f74?q=80&w=2074&auto=format&fit=crop"
                                alt="Tea Ceremony"
                                className="relative rounded-[2.5rem] shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700"
                            />
                        </div>
                    </div>
                    <div className="order-1 lg:order-2 space-y-6">
                        <h2 className="text-4xl font-serif font-bold text-tea-900">From a Small Garden to Your Cup</h2>
                        <div className="w-20 h-1 bg-tea-500 rounded-full" />
                        <p className="text-gray-600 text-lg leading-relaxed font-light">
                            Tea Haven began as a humble dream—a small garden in the foothills of the Himalayas where our founder, seeking solace from the digital noise, rediscovered the grounding power of tea.
                        </p>
                        <p className="text-gray-600 text-lg leading-relaxed font-light">
                            What started as a personal collection has grown into a curated sanctuary for tea lovers. We don't just sell tea; we curate moments. Each blend is designed not just for flavor, but for feeling—whether it's the morning clarity of a First Flush Darjeeling or the evening calm of our signature Chamomile drift.
                        </p>
                        <div className="pt-4 flex items-center gap-4">
                            <div className="flex -space-x-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-12 h-12 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                                        <img src={`https://randomuser.me/api/portraits/men/${i + 20}.jpg`} alt="Team" />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <p className="font-bold text-tea-900">Join 50,000+ Sippers</p>
                                <div className="flex text-amber-500">
                                    <Award size={14} fill="currentColor" />
                                    <Award size={14} fill="currentColor" />
                                    <Award size={14} fill="currentColor" />
                                    <Award size={14} fill="currentColor" />
                                    <Award size={14} fill="currentColor" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-32 text-center">
                    <h2 className="text-3xl font-serif font-bold text-tea-900 mb-6">Ready to find your perfect blend?</h2>
                    <a href="/shop" className="inline-flex items-center gap-2 px-8 py-4 bg-tea-800 text-white font-bold rounded-2xl hover:bg-tea-900 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
                        Explore Collection
                        <Heart size={18} className="text-red-400 fill-red-400" />
                    </a>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;
