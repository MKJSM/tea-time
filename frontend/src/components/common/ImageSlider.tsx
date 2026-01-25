
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { PLACEHOLDER_TEA_IMAGE } from '../../utils/images';

interface ImageSliderProps {
  images: string[];
  autoPlay?: boolean;
  interval?: number;
  className?: string;
  showArrows?: boolean;
  showDots?: boolean;
  aspectRatio?: string;
}

export const ImageSlider: React.FC<ImageSliderProps> = ({
  images,
  autoPlay = true,
  interval = 4000,
  className,
  showArrows = false,
  showDots = true,
  aspectRatio = "aspect-square"
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderImages = images.length > 0 ? images : [PLACEHOLDER_TEA_IMAGE];
  // Fix: Changed NodeJS.Timeout to any to avoid namespace errors in some environments
  const timerRef = useRef<any>(null);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === sliderImages.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? sliderImages.length - 1 : prev - 1));
  };

  useEffect(() => {
    if (autoPlay && sliderImages.length > 1) {
      timerRef.current = setInterval(nextSlide, interval);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoPlay, sliderImages.length, interval]);

  if (sliderImages.length === 0) return null;

  return (
    <div className={cn("relative group overflow-hidden", aspectRatio, className)}>
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={sliderImages[currentIndex]}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full object-cover"
          alt={`Tea preview ${currentIndex + 1}`}
        />
      </AnimatePresence>

      {showArrows && sliderImages.length > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); prevSlide(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); nextSlide(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {showDots && sliderImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {sliderImages.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.preventDefault(); setCurrentIndex(i); }}
              className={cn(
                "h-1 transition-all rounded-full",
                currentIndex === i ? "w-6 bg-white" : "w-1.5 bg-white/40"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};
