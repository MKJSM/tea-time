import { useEffect, useMemo, useState } from 'react';

import type { Banner } from '@tea-time/types';
import { BannerRenderer } from '@tea-time/ui';

const DEFAULT_BANNER: Banner = {
  id: 'default-home-banner',
  title: 'Tea, coffee, juices, and snacks delivered on a schedule that fits your team.',
  subtitle: 'Workplace refreshment',
  description:
    'Build a reliable daily routine for your office with fresh delivery, simple ordering, and a refreshment experience that stays consistent through every shift.',
  primary_button_label: 'Browse Menu',
  primary_button_href: '#categories',
  secondary_button_label: 'View Products',
  secondary_button_href: '/products',
  media_url: '/assets/home-Dr3wWsX4.webp',
  media_kind: 'image',
  content_mode: 'structured',
  content_html: null,
  content_json: null,
  background_type: 'gradient',
  background_value: 'linear-gradient(135deg, #375c36 0%, #7d8f49 42%, #283b24 100%)',
  overlay_color: null,
  text_color: '#ffffff',
  sort_order: 0,
  is_active: true,
};

interface Props {
  banners: Banner[];
}

export function HeroSlider({ banners }: Props) {
  const slides = useMemo(() => (banners.length ? banners : [DEFAULT_BANNER]), [banners]);
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
