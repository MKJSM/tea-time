
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Beaker, Sliders, Sparkles, Plus, Trash2, Info, ChevronRight, Droplets } from 'lucide-react';
import { useSommelierStore, useCartStore } from '../../store';
import { BlendComponent, Product } from '../../types';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';

const BASE_TEAS = [
  { id: 'b1', name: 'Imperial Sencha', color: '#4CAF50', profile: { grassy: 9, floral: 2, sweet: 4 } },
  { id: 'b2', name: 'Yunnan Black', color: '#5D4037', profile: { earthy: 8, nutty: 6, sweet: 5 } },
  { id: 'b3', name: 'Silver Needle', color: '#E1F5FE', profile: { floral: 8, sweet: 7, grassy: 2 } },
  { id: 'b4', name: 'Milk Oolong', color: '#FFF9C4', profile: { nutty: 8, sweet: 8, floral: 4 } },
];

const BOTANICALS = [
  { id: 'bot1', name: 'Dried Jasmine', color: '#F8BBD0', profile: { floral: 10, sweet: 2 } },
  { id: 'bot2', name: 'Madagascar Vanilla', color: '#F5F5DC', profile: { sweet: 10, nutty: 4 } },
  { id: 'bot3', name: 'Ginger Root', color: '#FFCC80', profile: { spicy: 10, sweet: 1 } },
  { id: 'bot4', name: 'Lavender Buds', color: '#E1BEE7', profile: { floral: 8, earthy: 3 } },
];

export const BlendingLab: React.FC = () => {
  const { activeBlend, updateBlend } = useSommelierStore();
  const addItem = useCartStore(state => state.addItem);

  const calculateProfile = (bases: BlendComponent[], bots: BlendComponent[]) => {
    // Mock molecular calculation logic
    const profile = { floral: 0, grassy: 0, nutty: 0, sweet: 0, earthy: 0, spicy: 0 };
    bases.forEach(b => {
      const ref = BASE_TEAS.find(r => r.id === b.id)?.profile || {};
      Object.keys(ref).forEach(k => {
        // @ts-ignore
        profile[k] += (ref[k] * (b.ratio / 100));
      });
    });
    bots.forEach(b => {
      const ref = BOTANICALS.find(r => r.id === b.id)?.profile || {};
      Object.keys(ref).forEach(k => {
        // @ts-ignore
        profile[k] += (ref[k] * 0.3); // Botanicals have less weight
      });
    });
    return profile;
  };

  const handleAddBotanical = (bot: any) => {
    if (activeBlend.botanicals.find(b => b.id === bot.id)) {
      toast.error("Botanical already infused.");
      return;
    }
    if (activeBlend.botanicals.length >= 3) {
      toast.error("Maximum 3 botanicals for optimal clarity.");
      return;
    }
    const newBots = [...activeBlend.botanicals, { ...bot, ratio: 10, type: 'botanical' }];
    updateBlend({
      botanicals: newBots,
      predictedProfile: calculateProfile(activeBlend.baseTeas, newBots)
    });
  };

  const handleRemoveBotanical = (id: string) => {
    const newBots = activeBlend.botanicals.filter(b => b.id !== id);
    updateBlend({
      botanicals: newBots,
      predictedProfile: calculateProfile(activeBlend.baseTeas, newBots)
    });
  };

  const handleAddToCart = () => {
    const customProduct: Product = {
      id: `custom-${Date.now()}`,
      name: activeBlend.name,
      categories: ['Custom Blend'],
      price: 34.99,
      rating: 5,
      image: 'https://images.unsplash.com/photo-1594631252845-29fc458695d7?auto=format&fit=crop&q=80&w=800',
      tags: ['AI Crafted', 'Unique'],
      flavorProfile: activeBlend.predictedProfile,
      brewing: { temperature: 85, time: 180, instructions: 'Expertly blended for your unique palate.' },
      story: `A one-of-a-kind creation merging ${activeBlend.baseTeas[0].name} with delicate botanicals.`,
      caffeine: 'Medium',
      origin: 'Tea Time Lab',
      format: 'Custom Blend'
    };
    addItem(customProduct, 1, activeBlend);
    toast.success("Artisanal blend added to vault!", { icon: '🧪' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-tea-900 rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

      {/* Visual Infusion Panel */}
      <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
        <div className="relative w-full aspect-square flex items-center justify-center">
          {/* Circular Infusion Ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-2 border-dashed border-white/10 rounded-full"
          />

          {/* Molecular Core Visual */}
          <div className="relative z-10 w-64 h-64">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
              <defs>
                <filter id="liquidGoo">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                  <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" />
                </filter>
              </defs>
              <g filter="url(#liquidGoo)">
                {/* Base Color Morph */}
                <motion.circle
                  cx="50" cy="50" r="30"
                  fill={activeBlend.baseTeas[0].color}
                  animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.8, 0.6] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
                {/* Botanical Infusion Particles */}
                {activeBlend.botanicals.map((bot, i) => (
                  <motion.circle
                    key={bot.id}
                    r="8"
                    fill={bot.color}
                    animate={{
                      cx: [50, 50 + (Math.cos(i) * 20), 50],
                      cy: [50, 50 + (Math.sin(i) * 20), 50],
                      scale: [0.8, 1.2, 0.8]
                    }}
                    transition={{ duration: 3 + i, repeat: Infinity }}
                  />
                ))}
              </g>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Beaker className="text-white/20" size={48} />
            </div>
          </div>

          {/* Floating Data Nodes */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-10 right-10 glass p-4 rounded-2xl border-white/10"
          >
            <div className="flex items-center gap-2 text-accent-400 text-xs font-bold uppercase tracking-widest mb-1">
              <Sparkles size={14} /> AI Prediction
            </div>
            <div className="text-white text-lg font-serif">
              {activeBlend.predictedProfile.floral > 5 ? 'Floral Serenity' : 'Artisanal Earth'}
            </div>
          </motion.div>
        </div>

        {/* Prediction Radar Mini */}
        <div className="w-full mt-10 grid grid-cols-3 gap-4">
          {(Object.entries(activeBlend.predictedProfile) as [string, number][]).map(([key, val]) => (
            <div key={key} className="text-center">
              <div className="text-[10px] text-white/40 font-bold uppercase mb-1">{key}</div>
              <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(val / 10) * 100}%` }}
                  className="h-full bg-accent-50"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls Panel */}
      <div className="lg:col-span-7 flex flex-col">
        <div className="flex-grow space-y-8">
          <header className="flex justify-between items-start">
            <div className="space-y-1">
              <input
                type="text"
                value={activeBlend.name}
                onChange={(e) => updateBlend({ name: e.target.value })}
                className="bg-transparent text-3xl font-serif font-bold text-white outline-none border-b border-white/10 focus:border-accent-500 transition-colors w-full"
                placeholder="Name your ritual..."
              />
              <p className="text-white/50 text-sm flex items-center gap-1">
                <Droplets size={14} /> Molecular Customization active
              </p>
            </div>
          </header>

          {/* Base Tea Selection */}
          <section>
            <h4 className="text-accent-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sliders size={14} /> Primary Base
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BASE_TEAS.map(tea => (
                <button
                  key={tea.id}
                  onClick={() => updateBlend({
                    baseTeas: [{ ...tea, ratio: 100, type: 'base' }],
                    predictedProfile: calculateProfile([{ ...tea, ratio: 100, type: 'base' }], activeBlend.botanicals)
                  })}
                  className={cn(
                    "p-4 rounded-2xl border transition-all text-left group",
                    activeBlend.baseTeas[0].id === tea.id
                      ? "bg-white/10 border-accent-500"
                      : "bg-white/5 border-white/10 hover:border-white/30"
                  )}
                >
                  <div className="w-3 h-3 rounded-full mb-3" style={{ backgroundColor: tea.color }} />
                  <div className="text-xs font-bold text-white group-hover:text-accent-400 transition-colors">
                    {tea.name}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Botanical Infusion */}
          <section>
            <h4 className="text-accent-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Plus size={14} /> Botanical Accents (Max 3)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BOTANICALS.map(bot => {
                const isSelected = activeBlend.botanicals.find(b => b.id === bot.id);
                return (
                  <button
                    key={bot.id}
                    onClick={() => isSelected ? handleRemoveBotanical(bot.id) : handleAddBotanical(bot)}
                    className={cn(
                      "p-4 rounded-2xl border transition-all text-left relative overflow-hidden",
                      isSelected
                        ? "bg-white/10 border-accent-500 shadow-[0_0_15px_rgba(255,235,59,0.2)]"
                        : "bg-white/5 border-white/10 hover:border-white/30"
                    )}
                  >
                    <div className="text-xs font-bold text-white mb-1">{bot.name}</div>
                    <div className="text-[10px] text-white/40">Infuse essence</div>
                    {isSelected && (
                      <div className="absolute bottom-1 right-2">
                        <div className="w-1 h-1 bg-accent-500 rounded-full animate-ping" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Applied Botanicals List */}
          <AnimatePresence>
            {activeBlend.botanicals.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex flex-wrap gap-2 pt-4 border-t border-white/10"
              >
                {activeBlend.botanicals.map(bot => (
                  <div key={bot.id} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full text-xs font-bold text-white border border-white/10">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: bot.color }} />
                    {bot.name}
                    <button onClick={() => handleRemoveBotanical(bot.id)} className="ml-1 text-white/40 hover:text-red-400">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Final CTA */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleAddToCart}
            className="flex-grow py-5 bg-accent-500 text-tea-900 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-accent-600 transition-all shadow-2xl hover:scale-[1.02] active:scale-95"
          >
            <Beaker size={20} />
            Finalize Molecular Blend
          </button>
          <button className="px-8 py-5 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all flex items-center gap-2">
            <Info size={18} className="text-accent-400" />
            Analysis Report
          </button>
        </div>
      </div>
    </div>
  );
};
