interface Props {
  activeSlide: number;
  onSlideChange: (index: number) => void;
}

export function HeroSlider({ activeSlide, onSlideChange }: Props) {
  return (
    <section className="hero-section">
      <div className="hero-slider">
        {/* Slide 1 — Tea delivery */}
        <article
          className={`hero-slide${activeSlide === 0 ? ' is-active' : ''}`}
          aria-hidden={activeSlide !== 0}
        >
          <div
            className="hero-slide-background"
            style={{
              background:
                'linear-gradient(180deg,rgba(0,0,0,.10),rgba(0,0,0,.26)),linear-gradient(135deg,#3d5a36,#7e8f45 44%,#2e4626)',
            }}
          />
          <div
            className="hero-overlay"
            style={{
              background:
                'linear-gradient(90deg,rgba(18,24,18,.62) 0%,rgba(18,24,18,.28) 38%,rgba(18,24,18,.08) 100%)',
            }}
          />
          <div className="hero-slide-content container">
            <div className="hero-copy">
              <span className="eyebrow">Daily Workplace Refreshment</span>
              <h1>Refreshment That Moves with Your Workday.</h1>
              <p>
                Daily delivery of hot &amp; cold beverages—tea, coffee, fresh juices—plus snacks,
                served at your workplace morning and evening, through a hassle-free subscription.
              </p>
              <p>Because energized teams build better businesses.</p>
              <div className="hero-actions-row">
                <a className="solid-button" href="#account">
                  Subscribe now
                </a>
                <a className="ghost-button" href="#categories">
                  Explore menu
                </a>
              </div>
              <div className="slide-badges">
                <span className="slide-badge">Delivered in hygienic thermosteel flasks</span>
                <span className="slide-badge">Freshly brewed using high-quality ingredients</span>
                <span className="slide-badge">Crafted with love &amp; care</span>
              </div>
            </div>
            <div className="hero-art">
              <img src="/assets/hero_main.png" alt="Fresh workplace tea" className="hero-img" />
              <div className="hero-card">
                <h4>SIP. ENERGIZE. REPEAT.</h4>
                <p>Reliable workplace refreshment, built around daily comfort and clean delivery.</p>
              </div>
            </div>
          </div>
        </article>

        {/* Slide 2 — App */}
        <article
          className={`hero-slide${activeSlide === 1 ? ' is-active' : ''}`}
          aria-hidden={activeSlide !== 1}
        >
          <div
            className="hero-slide-background"
            style={{
              background:
                'radial-gradient(circle at 22% 14%,rgba(255,255,255,.14),transparent 18%),linear-gradient(135deg,#efe7df 0%,#dedfd8 36%,#cfdbc8 100%)',
            }}
          />
          <div
            className="hero-overlay"
            style={{
              background:
                'linear-gradient(90deg,rgba(18,24,18,.38) 0%,rgba(18,24,18,.12) 42%,rgba(18,24,18,.02) 100%)',
            }}
          />
          <div className="hero-slide-content container">
            <div className="hero-copy">
              <span className="eyebrow">Smart Ordering App</span>
              <h1>One App. Endless Refreshment.</h1>
              <p>
                With the MOBILITEA app, ordering your daily beverages and snacks is just a tap
                away—simple, reliable, and made for busy workdays.
              </p>
              <div className="hero-actions-row">
                <a className="solid-button" href="#account">
                  Download the app
                </a>
                <a className="ghost-button" href="#why">
                  View features
                </a>
              </div>
              <div className="slide-badges">
                <span className="slide-badge">Customized Flask Ordering</span>
                <span className="slide-badge">Real-Time Order Tracking</span>
                <span className="slide-badge">Go Paperless. Go Green.</span>
              </div>
            </div>
            <div className="hero-art">
              <img src="/assets/hero_app.png" alt="Mobilitea App" className="hero-img" />
            </div>
          </div>
        </article>

        {/* Slide 3 — Events */}
        <article
          className={`hero-slide${activeSlide === 2 ? ' is-active' : ''}`}
          aria-hidden={activeSlide !== 2}
        >
          <div
            className="hero-slide-background"
            style={{
              background:
                'radial-gradient(circle at 20% 20%,rgba(255,255,255,.20),transparent 16%),linear-gradient(135deg,#6f295e 0%,#b055ac 40%,#dd8dbd 100%)',
            }}
          />
          <div
            className="hero-overlay"
            style={{
              background:
                'linear-gradient(90deg,rgba(17,24,18,.32) 0%,rgba(17,24,18,.08) 42%,rgba(17,24,18,.04) 100%)',
            }}
          />
          <div className="hero-slide-content container">
            <div className="hero-copy">
              <span className="eyebrow">Bulk &amp; Event Orders</span>
              <h1>Seamless Refreshment for Every Occasion.</h1>
              <p>
                MOBILITEA undertakes bulk, corporate, and event orders, delivering tea, coffee,
                beverages, and snacks with consistency and care—no matter the scale.
              </p>
              <div className="hero-actions-row">
                <a className="solid-button" href="#account">
                  Get your quote
                </a>
                <a className="ghost-button" href="#corporate">
                  Plan an event
                </a>
              </div>
            </div>
            <div className="hero-art">
              <img src="/assets/hero_events.png" alt="Corporate Events" className="hero-img" />
              <div className="event-panel">
                <h3>Perfect Tea for Your Special Events</h3>
                <p>Bulk, corporate, and event refreshment with premium service.</p>
              </div>
            </div>
          </div>
        </article>

        {/* Slide indicators */}
        <div className="slide-indicators container">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              type="button"
              className={`hero-indicator${activeSlide === i ? ' is-active' : ''}`}
              onClick={() => onSlideChange(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Ticker */}
      <div className="ticker-wrap">
        <div className="ticker">
          <span className="ticker-item">
            ☕ <b>Tech in every step</b> · taste in every sip
          </span>
          <span className="ticker-item">📍 Real-time delivery tracking</span>
          <span className="ticker-item">🧊 Temperature lock in insulated flasks</span>
          <span className="ticker-item">🏢 Built for offices, events, and institutions</span>
          <span className="ticker-item">
            ☕ <b>Tech in every step</b> · taste in every sip
          </span>
          <span className="ticker-item">📍 Real-time delivery tracking</span>
          <span className="ticker-item">🧊 Temperature lock in insulated flasks</span>
          <span className="ticker-item">🏢 Built for offices, events, and institutions</span>
        </div>
      </div>
    </section>
  );
}
