
import React from 'react';
import { motion } from 'framer-motion';
import { Coffee } from 'lucide-react';

interface Props {
  fullPage?: boolean;
}

const LoadingSpinner: React.FC<Props> = ({ fullPage }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center ${fullPage ? 'fixed inset-0 z-[100] bg-cream' : 'p-12'}`}
      role="status"
      aria-live="polite"
      aria-label="Loading content"
    >
      <div className="relative">
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-tea-700"
        >
          <Coffee size={48} aria-hidden="true" />
        </motion.div>
        {/* Steam particles */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 0, x: i * 5 - 10 }}
            animate={{ opacity: [0, 1, 0], y: -30, x: i * 5 - 10 + (Math.random() * 10 - 5) }}
            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.4 }}
            className="absolute top-0 left-1/2 w-1.5 h-4 bg-gray-200 rounded-full blur-sm"
          />
        ))}
      </div>
      <p className="mt-6 text-tea-900 font-serif italic text-lg animate-pulse">
        Steeping your tea journey...
      </p>
    </div>
  );
};

export default LoadingSpinner;
