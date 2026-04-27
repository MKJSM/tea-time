import { useEffect, useMemo, useState } from 'react';

import type { Banner } from '@tea-time/types';
import { BannerRenderer } from '@tea-time/ui';

// No internal DEFAULT_BANNER here, we rely on the parent providing banners or fallbacks.

interface Props {
  banners: Banner[];
}

export function HeroSlider({ banners }: Props) {
  const slides = banners;
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    setActiveSlide((current) => Math.min(current, Math.max(slides.length - 1, 0)));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 6000);

    return () => window.clearInterval(intervalId);
  }, [slides.length]);

  return (
    <section className="hero-section fade-up" aria-label="Homepage banners">
      <div className="hero-slider">
        {slides.map((banner, index) => {
          const isActive = activeSlide === index;

          return (
            <article
              key={banner.id}
              className={`hero-slide${isActive ? ' is-active' : ''}`}
              aria-hidden={!isActive}
            >
              <BannerRenderer banner={banner} variant="hero" />
            </article>
          );
        })}

        {slides.length > 1 ? (
          <div className="slide-indicators container">
            {slides.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                className={`hero-indicator${activeSlide === index ? ' is-active' : ''}`}
                onClick={() => setActiveSlide(index)}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
