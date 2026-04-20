/** Static marketing sections: Categories grid, Why us, Process, Who we serve, CTA band. */
export function MarketingContent() {
  return (
    <>
      {/* ── Categories ── */}
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

      {/* ── Why Mobilitea ── */}
      <section className="section fade-up" id="why">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Why Mobilitea</span>
              <h2>Built for quality, freshness, and reliability.</h2>
            </div>
            <p>
              Our key value story — quality ingredients, strict hygiene, smart technology, and
              on-time delivery.
            </p>
          </div>
          <div className="feature-grid">
            {[
              {
                icon: '🌿',
                title: 'Quality You Can Taste',
                desc: 'Made with high-quality ingredients and hygienically prepared for pure taste you can trust.',
              },
              {
                icon: '🛡️',
                title: 'Strict Hygiene Standards',
                desc: 'Prepared, handled, and packed with utmost hygiene because safety matters every day.',
              },
              {
                icon: '🔥',
                title: 'Freshness First',
                desc: 'Freshly brewed beverages delivered hot every time with no reheating and no compromise.',
              },
              {
                icon: '📱',
                title: 'Smart Subscription Control',
                desc: 'Ordering, tracking, pause, resume, and preference control built to feel effortless.',
              },
              {
                icon: '⏱️',
                title: 'Right on Time',
                desc: 'Morning and evening deliveries you can count on so teams never miss a tea break.',
              },
            ].map(({ icon, title, desc }) => (
              <article key={title} className="card feature-card">
                <div className="v2-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
          <div className="cta-row">
            <a className="outline-button" href="#account">
              Subscribe now
            </a>
          </div>
        </div>
      </section>

      {/* ── Process ── */}
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
              {
                n: '01',
                title: 'Start with Pure Water',
                desc: 'Great tea begins with fresh, clean purified water to preserve the true flavor of the leaves.',
              },
              {
                n: '02',
                title: 'Add Premium Tea Leaves',
                desc: 'Carefully measured high-quality leaves chosen for aroma, color, and balanced strength.',
              },
              {
                n: '03',
                title: 'Brew with Patience',
                desc: 'The tea is allowed to brew slowly so the leaves release full character and natural aroma.',
              },
              {
                n: '04',
                title: 'Serve Hot in Flask',
                desc: 'Immediately poured into thermosteel flasks to lock in heat, freshness, and flavor.',
              },
            ].map(({ n, title, desc }) => (
              <article key={n} className="card v2-step">
                <div className="step-num">{n}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who we serve ── */}
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
              {
                icon: '🏢',
                title: 'Corporate Offices & IT Parks',
                desc: 'Daily tea, coffee, and refreshment solutions for teams of all sizes.',
              },
              {
                icon: '🏬',
                title: 'Retail, Showrooms & Shops',
                desc: 'Consistent beverage service to keep staff refreshed throughout the day.',
              },
              {
                icon: '🏥',
                title: 'Hospitals & Institutions',
                desc: 'Reliable hygienic beverage supply for healthcare and educational spaces.',
              },
              {
                icon: '🏭',
                title: 'Factories & Industrial Units',
                desc: 'Large-volume, on-time refreshment service for shift-based teams.',
              },
              {
                icon: '🧑‍💼',
                title: 'Co-working Spaces',
                desc: 'Flexible plans tailored to dynamic workplaces and shared business centers.',
              },
              {
                icon: '🎉',
                title: 'Meetings, Events & Gatherings',
                desc: 'Tea, coffee, juices, and snacks for conferences, launches, and celebrations.',
              },
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

      {/* ── CTA Band ── */}
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
              <a className="solid-button" href="#account">
                Subscribe now
              </a>
              <button className="outline-button" type="button">
                Get corporate quote
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
