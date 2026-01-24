
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';

export type TeaVariant = 'green' | 'black' | 'herbal' | 'matcha' | 'oolong' | 'water';
export type LoaderType = 'steeping' | 'leaves' | 'cup-fill' | 'whisk' | 'kettle' | 'bag';

interface TeaLoaderProps {
  type: LoaderType;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  variant?: TeaVariant;
  message?: string;
  className?: string;
}

const colors: Record<TeaVariant, string> = {
  green: '#81C784',
  black: '#5D4037',
  herbal: '#CE93D8',
  matcha: '#4CAF50',
  oolong: '#FFB300',
  water: '#E3F2FD'
};

const SteepingAnimation = ({ variant = 'green' }: { variant?: TeaVariant }) => (
  <div className="relative w-24 h-24 flex items-center justify-center">
    {/* Cup */}
    <div className="absolute bottom-2 w-16 h-12 border-4 border-tea-800 rounded-b-3xl border-t-0" />
    <div className="absolute bottom-[46px] w-16 h-2 border-t-2 border-tea-800/20" />

    {/* Liquid Filling */}
    <motion.div
      initial={{ height: 0 }}
      animate={{ height: '36px' }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      className="absolute bottom-3 w-[56px] rounded-b-[1.4rem] opacity-60"
      style={{ backgroundColor: colors[variant as TeaVariant] }}
    />

    {/* Steam Particles */}
    {[1, 2, 3].map((i) => (
      <motion.div
        key={i}
        initial={{ y: -10, opacity: 0, x: (i - 2) * 10 }}
        animate={{ y: -40, opacity: [0, 1, 0], x: (i - 2) * 10 + (i % 2 === 0 ? 5 : -5) }}
        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
        className="absolute w-1 h-6 bg-gray-200/50 rounded-full blur-sm"
      />
    ))}
  </div>
);

const WhiskAnimation = () => (
  <div className="relative w-24 h-24 flex items-center justify-center">
    {/* Bowl */}
    <div className="absolute bottom-2 w-20 h-10 border-4 border-earth-800 rounded-b-full bg-tea-100/30" />
    {/* Whisk (Chasen) */}
    <motion.div
      animate={{
        x: [-15, 15, -15],
        rotate: [-5, 5, -5]
      }}
      transition={{ duration: 0.6, repeat: Infinity, ease: "linear" }}
      className="absolute top-4 w-6 h-14 bg-earth-200 rounded-t-lg border-x-2 border-earth-300"
    >
      <div className="absolute bottom-0 w-full h-8 flex justify-around px-1">
        {[1, 2, 3, 4].map(i => <div key={i} className="w-0.5 h-full bg-earth-400 rounded-full" />)}
      </div>
    </motion.div>
  </div>
);

const KettleAnimation = ({ variant = 'water' }: { variant?: TeaVariant }) => (
  <div className="relative w-36 h-28 flex items-center justify-center">
    {/* Kettle Body */}
    <motion.div
      animate={{
        rotate: [0, -35, 0],
        y: [0, -5, 0]
      }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="absolute left-2 w-20 h-16 bg-white border-2 border-gray-100 rounded-[2rem] shadow-xl z-20 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-gray-50/50 to-transparent" />
      <div className="absolute -right-4 top-4 w-8 h-6 bg-white border-2 border-gray-100 rounded-r-full" />
    </motion.div>

    {/* Animated Steam from Spout */}
    <motion.div
      animate={{
        opacity: [0, 1, 0],
        y: [-10, -40],
        x: [55, 60]
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
      className="absolute w-2 h-2 bg-gray-200/40 rounded-full blur-md z-10"
    />

    {/* Elegant Pouring Stream */}
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{
        height: [0, 80, 80, 0],
        opacity: [0, 0.8, 0.8, 0],
        scaleX: [1, 1.2, 0.8, 1]
      }}
      transition={{ duration: 4, repeat: Infinity, times: [0.1, 0.4, 0.8, 1] }}
      className="absolute right-8 top-8 w-1.5 rounded-full blur-[1.5px] z-10 origin-top shadow-inner"
      style={{ backgroundColor: colors[variant as TeaVariant] }}
    />

    {/* Receiving Ritual Cup */}
    <div className="absolute right-2 bottom-4 w-14 h-10 border-2 border-tea-800/80 rounded-b-2xl bg-white/30 backdrop-blur-sm z-0 shadow-inner">
      <motion.div
        animate={{ height: ['0%', '70%', '70%', '0%'] }}
        transition={{ duration: 4, repeat: Infinity, times: [0.1, 0.5, 0.8, 1] }}
        className="absolute bottom-0 left-0 right-0 rounded-b-[0.9rem] opacity-40"
        style={{ backgroundColor: colors[variant as TeaVariant] }}
      />
    </div>
  </div>
);

const LeavesAnimation = ({ variant = 'green' }: { variant?: TeaVariant }) => (
  <div className="relative w-24 h-24">
    {[1, 2, 3, 4, 5].map((i) => (
      <motion.div
        key={i}
        initial={{ top: -20, left: Math.random() * 80, rotate: 0, opacity: 0 }}
        animate={{
          top: 100,
          left: (Math.random() * 80) + (Math.random() * 20 - 10),
          rotate: 360,
          opacity: [0, 1, 0]
        }}
        transition={{ duration: 3, repeat: Infinity, delay: i * 0.6 }}
        className="absolute w-4 h-6 rounded-full blur-[0.5px]"
        style={{
          backgroundColor: colors[variant as TeaVariant],
          borderRadius: '100% 0% 100% 0% / 100% 0% 100% 0%'
        }}
      />
    ))}
  </div>
);

export const TeaLoader: React.FC<TeaLoaderProps> = ({
  type,
  size = 'medium',
  variant = 'green',
  message,
  className
}) => {
  const isFullscreen = size === 'fullscreen';

  const renderAnimation = () => {
    const v = variant as TeaVariant;
    switch (type) {
      case 'steeping': return <SteepingAnimation variant={v} />;
      case 'whisk': return <WhiskAnimation />;
      case 'kettle': return <KettleAnimation variant={v} />;
      case 'leaves': return <LeavesAnimation variant={v} />;
      default: return <SteepingAnimation variant={v} />;
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center transition-all",
        isFullscreen ? "fixed inset-0 bg-cream/95 z-[100]" : "p-6",
        size === 'small' && "scale-50",
        size === 'large' && "scale-125",
        className
      )}
      role="status"
      aria-label={message || "Preparing something warm & special..."}
    >
      <div className="mb-6">
        {renderAnimation()}
      </div>
      {message && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-tea-900 font-serif italic text-xl animate-pulse text-center max-w-xs tracking-tight"
        >
          {message === "Pouring your journey details..." ? "Preparing something warm & special..." : message}
        </motion.p>
      )}
    </div>
  );
};
