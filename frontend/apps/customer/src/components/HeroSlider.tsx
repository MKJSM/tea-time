import type { CSSProperties } from 'react';

import type { Banner } from '@tea-time/types';

interface Props {
  banners: Banner[];
  activeSlide: number;
  onSlideChange: (index: number) => void;
}

function slideBackgroundStyle(banner: Banner): CSSProperties {
  if (banner.background_type === 'solid' || banner.background_type === 'gradient') {
    return {
      background:
        banner.background_value ??
        'linear-gradient(135deg, #375c36 0%, #7d8f49 42%, #283b24 100%)',
    };
  }

  const source = banner.background_value || banner.media_url;
  if (!source) {
    return {
      background: 'linear-gradient(135deg, #375c36 0%, #7d8f49 42%, #283b24 100%)',
    };
  }

  return {
    backgroundColor: '#1d2b20',
    backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.12), rgba(0, 0, 0, 0.28)), url(${source})`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
  };
}

export function HeroSlider({ banners, activeSlide, onSlideChange }: Props) {
  const slides = banners.length ? banners : [];
  const currentSlide = slides.length ? activeSlide % slides.length : 0;

  return (
    <section className="hero-section">
      <div className="hero-slider">
        {slides.map((banner, index) => {
          const isActive = currentSlide === index;
          const textColor = banner.text_color ?? '#ffffff';
          const hasMedia = Boolean(banner.media_url);

          return (
            <article
              key={banner.id}
              className={`hero-slide${isActive ? ' is-active' : ''}`}
              aria-hidden={!isActive}
            >
              <div className="hero-slide-background" style={slideBackgroundStyle(banner)} />
              <div
                className="hero-overlay"
                style={{
                  background:
                    banner.overlay_color ??
                    'linear-gradient(90deg,rgba(18,24,18,.62) 0%,rgba(18,24,18,.28) 38%,rgba(18,24,18,.08) 100%)',
                }}
              />
              <div className="hero-slide-content container">
                <div className="hero-copy" style={{ '--hero-text': textColor } as CSSProperties}>
                  {banner.subtitle ? <span className="eyebrow">{banner.subtitle}</span> : null}
                  <h1>{banner.title}</h1>
                  {banner.description ? <p>{banner.description}</p> : null}
                  <div className="hero-actions-row">
                    {banner.primary_button_label && banner.primary_button_href ? (
                      <a className="solid-button" href={banner.primary_button_href}>
                        {banner.primary_button_label}
                      </a>
                    ) : null}
                    {banner.secondary_button_label && banner.secondary_button_href ? (
                      <a className="ghost-button" href={banner.secondary_button_href}>
                        {banner.secondary_button_label}
                      </a>
                    ) : null}
                  </div>
                  <div className="slide-badges">
                    <span className="slide-badge">Freshly brewed for the workday</span>
                    <span className="slide-badge">Simple ordering, reliable delivery</span>
                    {hasMedia ? <span className="slide-badge">Banner media from admin</span> : null}
                  </div>
                </div>
                <div className="hero-art">
                  {banner.media_kind === 'video' && banner.media_url ? (
                    <video
                      className="hero-img"
                      src={banner.media_url}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : banner.media_url ? (
                    <img src={banner.media_url} alt={banner.title} className="hero-img" />
                  ) : (
                    <div className="hero-card hero-card--fallback">
                      <h4>Admin-managed banner</h4>
                      <p>{banner.title}</p>
                    </div>
                  )}
                  {banner.media_url ? null : (
                    <div className="hero-card">
                      <h4>{banner.subtitle ?? 'Landing banner'}</h4>
                      <p>{banner.description ?? 'Managed from the admin banner pipeline.'}</p>
                    </div>
                  )}
                </div>
              </div>
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
