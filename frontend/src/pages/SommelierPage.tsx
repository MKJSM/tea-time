
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Brain, Clock, Sun, Moon, Coffee, Heart, Wind, ChevronRight, Share2, Info } from 'lucide-react';
import { BlendingLab } from '../components/sommelier/BlendingLab';
import { useSommelierStore } from '../../../store';
import { cn } from '../../utils/cn';

const MOODS = [
  { id: 'focus', label: 'Focused', icon: Brain, color: '#2E7D32', desc: 'Sharpen your cognitive baseline' },
  { id: 'zen', label: 'Serene', icon: Wind, color: '#81C784', desc: 'Transition into deep relaxation' },
  { id: 'energy', label: 'Vibrant', icon: Sparkles, color: '#FFD54F', desc: 'Awaken your sensory networks' },
  { id: 'health', label: 'Healing', icon: Heart, color: '#E1BEE7', desc: 'Fortify your biological defenses' },
];

const SommelierPage: React.FC = () => {
  const { currentMood, setMood } = useSommelierStore();
  const [activeTab, setActiveTab] = useState<'ai' | 'lab'>('ai');

  const getTimeStatus = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { label: 'Morning Ritual', icon: Sun };
    if (hour < 18) return { label: 'Mid-Day Pivot', icon: Coffee };
    return { label: 'Evening Unwind', icon: Moon };
  };

  const status = getTimeStatus();

  return (
    <div className="min-h-screen bg-cream pb-20 overflow-x-hidden">
      {/* Dynamic Header */}
      <section className="relative h-[400px] flex items-center justify-center text-center px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1571935443242-c1a199bc2830?auto=format&fit=crop&q=80&w=2000"
            className="w-full h-full object-cover opacity-10"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cream" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-tea-900 text-white rounded-full text-xs font-bold uppercase tracking-widest mb-8 shadow-xl">
            <status.icon size={14} className="text-accent-500" />
            {status.label} Active
          </div>
          <h1 className="text-5xl md:text-7xl font-serif font-bold text-tea-900 mb-6 leading-tight">
            Consult the <span className="italic text-tea-600 underline decoration-accent-500/50">Sommelier</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-xl mx-auto font-light leading-relaxed">
            Our AI-powered molecular analyst crafts the perfect ritual based on your biological needs and current environment.
          </p>
        </motion.div>
      </section>

      <div className="max-w-7xl mx-auto px-4">
        {/* Mood Selector */}
        <section className="mb-20">
          <div className="flex justify-center mb-10">
            <div className="bg-white p-2 rounded-2xl shadow-xl flex gap-1 border border-gray-100">
              <button
                onClick={() => setActiveTab('ai')}
                className={cn(
                  "px-8 py-3 rounded-xl font-bold transition-all text-sm flex items-center gap-2",
                  activeTab === 'ai' ? "bg-tea-900 text-white shadow-lg" : "text-gray-400 hover:text-tea-900"
                )}
              >
                <span className="flex items-center gap-2"><Sparkles size={16} /> AI Sommelier</span>
              </button>
              <button
                onClick={() => setActiveTab('lab')}
                className={cn(
                  "px-8 py-3 rounded-xl font-bold transition-all text-sm flex items-center gap-2",
                  activeTab === 'lab' ? "bg-tea-900 text-white shadow-lg" : "text-gray-400 hover:text-tea-900"
                )}
              >
                <span className="flex items-center gap-2"><BeakerIcon size={16} /> Digital Blending Lab</span>
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'ai' ? (
              <motion.div
                key="ai-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-12"
              >
                <div className="text-center">
                  <h3 className="text-2xl font-serif font-bold text-tea-900 mb-8 italic">What state of being do you seek?</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {MOODS.map(mood => (
                      <button
                        key={mood.id}
                        onClick={() => setMood(mood.label)}
                        className={cn(
                          "relative p-8 rounded-[2.5rem] border-2 transition-all group overflow-hidden",
                          currentMood === mood.label
                            ? "bg-white border-tea-600 shadow-2xl scale-105"
                            : "bg-white/50 border-gray-100 hover:border-tea-200"
                        )}
                      >
                        {currentMood === mood.label && (
                          <motion.div
                            layoutId="mood-glow"
                            className="absolute inset-0 -z-10 opacity-10"
                            style={{ backgroundColor: mood.color }}
                          />
                        )}
                        <mood.icon size={32} className={cn("mx-auto mb-4 transition-colors", currentMood === mood.label ? "text-tea-700" : "text-gray-300")} />
                        <h4 className="font-bold text-tea-900 mb-1">{mood.label}</h4>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">{mood.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recommendation Card */}
                <div className="bg-white rounded-[3rem] p-10 md:p-16 shadow-2xl border border-tea-50 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 text-tea-100 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Sparkles size={200} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
                    <div className="space-y-6">
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent-100 text-accent-900 text-[10px] font-bold uppercase tracking-widest rounded-full">
                        <Info size={14} /> Sommelier Logic Applied
                      </div>
                      <h2 className="text-4xl md:text-5xl font-serif font-bold text-tea-900">High-Mountain <br /> <span className="text-tea-600">Alishan Oolong</span></h2>
                      <p className="text-gray-500 leading-relaxed font-light text-lg">
                        "Your request for <span className="font-bold text-tea-900">{currentMood}</span> during the {status.label.toLowerCase()} aligns perfectly with this high-altitude oolong. The unique floral-cream molecular structure stabilizes alpha brain waves without the post-caffeine crash."
                      </p>
                      <div className="flex gap-4 pt-4">
                        <div className="p-4 bg-cream rounded-2xl border border-tea-100">
                          <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Caffeine Efficiency</p>
                          <p className="font-serif font-bold text-tea-900">Balanced (45mg)</p>
                        </div>
                        <div className="p-4 bg-cream rounded-2xl border border-tea-100">
                          <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Dominant Note</p>
                          <p className="font-serif font-bold text-tea-900">Buttery Lily</p>
                        </div>
                      </div>
                      <div className="pt-6 flex gap-4">
                        <button className="px-10 py-4 bg-tea-700 hover:bg-tea-800 text-white font-bold rounded-2xl transition-all shadow-xl">
                          Adopt this Ritual
                        </button>
                        <button className="p-4 bg-white border border-gray-100 text-gray-400 hover:text-tea-700 rounded-2xl transition-all">
                          <Share2 size={20} />
                        </button>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl ring-8 ring-white">
                        <img
                          src="https://images.unsplash.com/photo-1594631252845-29fc458695d7?auto=format&fit=crop&q=80&w=1000"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-tea-900/40 to-transparent" />
                      </div>
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute -bottom-6 -left-6 bg-accent-500 text-tea-900 p-6 rounded-3xl shadow-2xl font-serif font-bold italic border-4 border-white"
                      >
                        "The Architect's Choice"
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="lab-tab"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
              >
                <BlendingLab />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Education Section */}
        <section className="py-20 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: 'The Bio-Chemistry of Tea', desc: 'Understanding L-theanine and its role in modern mental health.', icon: Brain },
              { title: 'Extraction Precision', desc: 'Why molecular density affects the flavor architecture of your brew.', icon: Clock },
              { title: 'Heritage Sourcing', desc: 'How terroir influences the mineral composition of every single leaf.', icon: Heart },
            ].map((item, i) => (
              <div key={i} className="space-y-4">
                <div className="w-12 h-12 bg-tea-50 text-tea-700 rounded-2xl flex items-center justify-center">
                  <item.icon size={24} />
                </div>
                <h3 className="text-xl font-serif font-bold text-tea-900">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed font-light">{item.desc}</p>
                <button className="text-tea-700 font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:underline">
                  Read Monograph <ChevronRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const BeakerIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4.5 3h15" /><path d="M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3" /><path d="M6 14h12" />
  </svg>
);

export default SommelierPage;
