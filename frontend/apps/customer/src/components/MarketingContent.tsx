/** ── Categories ── */
export function CategoriesSection() {
  return (
    <section className="section fade-up" id="categories">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow">Categories</span>
            <h2>Choose from every kind of workplace refreshment.</h2>
          </div>
          <p>
            Hot beverages, coolers, milkshakes, fresh juices, snacks, sandwiches, and desserts —
            delivered fresh every day.
          </p>
        </div>
        <div className="category-grid">
          {[
            { label: 'Hot Beverages', cls: '', art: <div className="v2-kettle" /> },
            { label: 'Coolers', cls: 'cooler', art: <div className="v2-glass" /> },
            {
              label: 'Milkshakes',
              cls: 'milkshake',
              art: <div className="v2-glass" style={{ left: 84 }} />,
            },
            {
              label: 'Fresh Juices',
              cls: 'juice',
              art: <div className="v2-glass juice" style={{ left: 84 }} />,
            },
            {
              label: 'Snacks',
              cls: 'snack',
              art: (
                <div className="v2-biscuit-stack">
                  <div className="v2-cookie one" />
                  <div className="v2-cookie two" />
                  <div className="v2-cookie three" />
                </div>
              ),
            },
            { label: 'Sandwiches', cls: 'sandwich', art: <div className="v2-cake-loaf sandwich" /> },
            { label: 'Desserts', cls: 'dessert', art: <div className="v2-cake-loaf" /> },
          ].map(({ label, cls, art }) => (
            <article key={label} className="card category-card">
              <div className={`category-media${cls ? ' ' + cls : ''}`}>{art}</div>
              <div className="category-body">
                <h3>{label}</h3>
                <p>Freshly prepared and ready for repeat ordering.</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/** ── Why Mobilitea ── */
export function WhySection() {
  return (
    <section className="section-dark fade-up" id="why">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow" style={{ color: 'var(--accent)' }}>The MOBILITEA Difference</span>
            <h2 className="serif" style={{ color: 'var(--fg-inv)' }}>Why Choose Us?</h2>
          </div>
          <p style={{ color: 'rgba(240, 236, 228, 0.6)', maxWidth: 480 }}>
            Ten reasons thousands of workplaces trust MOBILITEA for daily refreshment.
          </p>
        </div>
        <div className="feature-grid-v2">
          {[
            { n: '01', title: 'Quality You Can Taste', desc: 'Made with high-quality ingredients. Hygienically prepared. Pure taste you can trust.' },
            { n: '02', title: 'Strict Hygiene Standards', desc: 'Prepared, handled & packed with utmost hygiene. Because safety matters.' },
            { n: '03', title: 'Freshness First', desc: 'Freshly brewed beverages. Delivered hot. Every time. No reheating. No compromises.' },
            { n: '04', title: 'Consistent Every Sip', desc: "Same great taste. Every delivery. That's the Mobilitea promise." },
            { n: '05', title: 'Temperature Maintained', desc: 'Fresh beverages in hygienic thermosteel flasks. Stays hot for hours.' },
            { n: '06', title: 'Right on Time', desc: 'Morning & evening delivery you can count on. Never miss a tea break.' },
            { n: '07', title: 'One Partner. Everything.', desc: 'Tea, coffee, juices & snacks—one solution. Simple. Reliable. Complete.' },
            { n: '08', title: 'Smart & Sustainable', desc: 'Thermosteel flasks. Paperless ordering. Good for your team. Better for the planet.' },
            { n: '09', title: 'Order in Seconds', desc: 'App-based ordering & real-time tracking. Refreshments made effortless.' },
            { n: '10', title: 'Built for Business', desc: 'Daily subscriptions, bulk & corporate orders. We scale as you grow.' },
          ].map(({ n, title, desc }) => (
            <article key={title} className="dark-card">
              <div className="mono" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginBottom: 8, letterSpacing: '.12em' }}>{n}</div>
              <h3 className="serif" style={{ color: 'var(--fg-inv)', fontSize: 16, marginBottom: 7 }}>{title}</h3>
              <p style={{ fontSize: 12, color: 'rgba(240, 236, 228, 0.55)', lineHeight: 1.6 }}>{desc}</p>
            </article>
          ))}
        </div>
        <div className="cta-row" style={{ textAlign: 'center', marginTop: 52 }}>
          <a className="solid-button" href="#menu" style={{ padding: '16px 36px' }}>
            Upgrade Your Workplace Breaks Today →
          </a>
        </div>
      </div>
    </section>
  );
}

/** ── Process ── */
export function HowWeBrew() {
  return (
    <section className="section fade-up" id="ritual">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow">How we make the perfect cuppa ☕</span>
            <h2>The Mobilitea way, kept simple and consistent.</h2>
          </div>
          <p>
            A clean summary of our tea-making ritual, kept short so the page stays elegant and
            easy to scan.
          </p>
        </div>
        <div className="steps-grid">
          {[
            { n: '01', icon: '💧', title: 'Pure, Fresh RO Water', desc: 'We always use fresh, clean, purified water—never reused or over-boiled—to preserve the true flavor of the tea leaves.' },
            { n: '02', icon: '🌡️', title: 'Heat to the Right Temperature', desc: 'Water is heated to the ideal boiling point, not aggressively boiled. Ensures proper extraction without burning the leaves.' },
            { n: '03', icon: '🌿', title: 'Add Premium Tea Leaves', desc: 'Carefully measured, high-quality tea leaves sourced for aroma, color, and strength. No shortcuts. Just real tea.' },
            { n: '04', icon: '⏳', title: 'Brew with Patience', desc: 'The tea brews slowly so the leaves release their full character—rich color, natural aroma, and balanced strength.' },
            { n: '05', icon: '🥛', title: 'Add Fresh Milk', desc: 'Fresh, high-quality milk in the perfect ratio. Gently simmered—not rushed—for a smooth, creamy texture.' },
            { n: '06', icon: '⚖️', title: 'Perfect the Balance', desc: 'Sweeteners added only after tasting—not too strong, not too light. Just right.' },
            { n: '07', icon: '✨', title: 'Strain to Perfection', desc: 'Expertly strained for a clean, smooth cup—no residue, no bitterness, only pure comfort.' },
            { n: '08', icon: '🫙', title: 'Served in Thermosteel Flask', desc: 'Immediately poured into insulated thermosteel flasks to lock in heat, freshness, and flavor.' },
          ].map(({ n, icon, title, desc }) => (
            <article key={n} className="card v2-step">
              <div className="step-num">{icon}</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent)', marginBottom: 4 }}>STEP {n}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/** ── Who we serve ── */
export function WhoWeServe() {
  return (
    <section className="section fade-up" id="corporate">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="eyebrow">Who we serve</span>
            <h2>Built for workplaces, institutions, and events.</h2>
          </div>
          <p>From busy IT parks to celebratory occasions — we keep everyone refreshed.</p>
        </div>
        <div className="serve-grid">
          {[
            { icon: '🏢', title: 'Corporate Offices & IT Parks', desc: 'Daily tea, coffee, and refreshment solutions for teams of all sizes.' },
            { icon: '🏬', title: 'Shops & Retail Outlets', desc: 'Consistent beverage service to keep staff refreshed throughout the day.' },
            { icon: '🏥', title: 'Hospitals & Healthcare', desc: 'Reliable, hygienic beverage supply for doctors, nurses, and support staff.' },
            { icon: '🏛️', title: 'Government & Institutions', desc: 'Trusted service with punctual delivery and standardized quality.' },
            { icon: '🏫', title: 'Educational Institutions', desc: 'Staff rooms, admin offices, and special events.' },
            { icon: '🎉', title: 'Events & Gatherings', desc: 'Tea, coffee, juices & snacks for conferences, launches, and celebrations.' },
            { icon: '🏭', title: 'Factories & Industrial Units', desc: 'Large-volume, on-time refreshment service for shift-based teams.' },
            { icon: '🏠', title: 'Co-working Spaces', desc: 'Flexible plans tailored to dynamic, fast-moving workplaces.' },
          ].map(({ icon, title, desc }) => (
            <article key={title} className="card serve-card">
              <div className="v2-icon">{icon}</div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/** ── About Us ── */
export function AboutSection() {
  return (
    <section className="section fade-up" id="about">
      <div className="container">
        <div className="customer-grid wide">
          <div className="panel">
            <span className="eyebrow">Our Story</span>
            <h2 className="serif" style={{ fontSize: 32, marginBottom: 20 }}>
              India's Most Trusted Workplace Refreshment Ecosystem
            </h2>
            <div style={{ marginBottom: 24 }}>
              <strong style={{ color: 'var(--accent)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '.1em', display: 'block', marginBottom: 8 }}>🌿 Vision</strong>
              <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>To become India's most trusted and innovative workplace refreshment ecosystem, redefining how people sip, energize, and perform—every day.</p>
            </div>
            <div>
              <strong style={{ color: 'var(--accent)', textTransform: 'uppercase', fontSize: 11, letterSpacing: '.1em', display: 'block', marginBottom: 8 }}>🎯 Mission</strong>
              <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>To deliver a complete refreshment solution through freshly prepared beverages and snacks, powered by technology, sustainability, and service excellence.</p>
            </div>
          </div>
          <div className="panel v2-stats-panel">
            <div className="stats-row">
              <div className="stat-item">
                <div className="serif stat-num">500+</div>
                <div className="stat-label">Workplaces</div>
              </div>
              <div className="stat-item">
                <div className="serif stat-num">10K+</div>
                <div className="stat-label">Daily Cups</div>
              </div>
              <div className="stat-item">
                <div className="serif stat-num">99%</div>
                <div className="stat-label">On-Time</div>
              </div>
            </div>
            <div className="list-stack" style={{ marginTop: 24 }}>
              {[
                { t: 'Quality First', d: 'We never compromise on taste, freshness, or ingredients.' },
                { t: 'Customer-Centricity', d: 'From customized flasks to real-time tracking, every service is designed around your convenience.' },
                { t: 'Sustainability', d: 'We go paperless, reduce waste, and promote reusable solutions.' }
              ].map((v, i) => (
                <div key={i} className="list-card simple">
                  <strong>{v.t}</strong>
                  <p>{v.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** ── CTA Band ── */
export function CTABand() {
  return (
    <section className="section fade-up">
      <div className="container">
        <div className="cta-band">
          <span className="eyebrow">Upgrade your workplace breaks</span>
          <h2>
            A refreshment system that feels premium, dependable, and easy to manage.
          </h2>
          <p>
            Daily subscriptions, event support, app-based ordering, paperless billing, and
            customized flask delivery — all in one.
          </p>
          <div className="cta-band-actions">
            <a className="solid-button" href="#menu">
              Get Started Free →
            </a>
            <button className="outline-button" type="button">
              Get corporate quote
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
