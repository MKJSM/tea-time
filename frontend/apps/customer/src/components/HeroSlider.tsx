import type { Banner } from '@tea-time/types';

import { BannerRenderer } from '@tea-time/ui';

interface Props {
  banners: Banner[];
  activeSlide: number;
  onSlideChange: (index: number) => void;
}

export function HeroSlider({ banners, activeSlide, onSlideChange }: Props) {
  const slides = banners.length ? banners : [];
  const currentSlide = slides.length ? activeSlide % slides.length : 0;

  return (
    <section className="hero-section">
      <div className="hero-slider">
        {slides.map((banner, index) => {
          const isActive = currentSlide === index;

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
                className={`hero-indicator${currentSlide === index ? ' is-active' : ''}`}
                onClick={() => onSlideChange(index)}
                aria-label={`Slide ${index + 1}`}
              />
            ))}
          </div>
        ) : null}
      </div>

    </section>
  );
}
