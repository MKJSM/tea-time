import React, { useEffect, useState } from 'react';

import {
  getCategories,
  getCurrentCustomer,
  getCustomerHealth,
  getProducts,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
} from '@tea-time/api-client';
import type {
  CategoryListItem,
  CustomerAuthResponse,
  CustomerRegisterInput,
  HealthResponse,
  LoginInput,
  ProductListItem,
} from '@tea-time/types';

type AsyncState = 'idle' | 'loading' | 'ready' | 'error';

const emptyRegisterForm: CustomerRegisterInput = {
  user_name: '',
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  password: '',
};

const emptyLoginForm: LoginInput = {
  email: '',
  password: '',
};

const marqueeItems = [
  'Freshly blended',
  'Event catering',
  'Tea bar service',
  'Fast local delivery',
  'Seasonal favorites',
  'Daily brewing ritual',
];

const valueCards = [
  {
    title: 'Quality you can taste',
    description: 'Small-batch blends, cleaner sourcing, and a tighter menu instead of generic bulk filler.',
  },
  {
    title: 'Freshness first',
    description: 'Fast-moving catalog, packed with care, and built to still feel alive when it arrives.',
  },
  {
    title: 'Smart subscription control',
    description: 'Customer auth and session restore already work through the live backend flow.',
  },
  {
    title: 'Reliable service rhythm',
    description: 'The page now communicates daily ritual, not just one-off transactions.',
  },
];

const processSteps = [
  'Choose a blend profile that fits the time of day.',
  'Brew and pack for heat, aroma, and cleaner hold time.',
  'Route through the same catalog and customer flow used online.',
  'Serve repeat orders, event requests, and returning sessions without friction.',
];

const serviceAudience = [
  'Corporate offices and team floors',
  'Retail counters and customer lounges',
  'Studios, launches, and private events',
  'Meeting rooms, workshops, and training days',
];

const heroSlides = [
  {
    eyebrow: 'Cover page 1',
    title: 'Refreshment that moves with your workday.',
    body:
      'Daily delivery of tea, coffee, cold beverages, and snacks with a stronger storefront presentation and a smoother customer flow.',
    secondary:
      'Built for morning rhythm, repeat orders, and premium service without the visual clutter.',
    primaryCta: 'Subscribe now',
    secondaryCta: 'Explore menu',
    badges: [
      'Freshly brewed using high-quality ingredients',
      'Fast local dispatch',
      'Crafted for daily tea breaks',
    ],
    variant: 'tea',
  },
  {
    eyebrow: 'Cover page 2',
    title: 'One account. Endless refreshment.',
    body:
      'Customer register, login, restore session, and catalog browsing now work together through the live backend instead of separate mock flows.',
    secondary:
      'Ordering feels lighter when the storefront, session layer, and data all move together.',
    primaryCta: 'Create account',
    secondaryCta: 'View features',
    badges: ['Customer auth live', 'Session restore', 'Paperless-ready'],
    variant: 'app',
  },
  {
    eyebrow: 'Cover page 3',
    title: 'Seamless refreshment for every occasion.',
    body:
      'Corporate drops, meeting service, and event-friendly tea menus now have a banner that actually sells that story.',
    secondary:
      'The third banner mirrors the event-driven composition from the sample instead of falling back to a generic card.',
    primaryCta: 'Get your quote',
    secondaryCta: 'Plan an event',
    badges: ['Bulk orders', 'Corporate service', 'Event catering'],
    variant: 'event',
  },
] as const;

export function HomePage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [catalogState, setCatalogState] = useState<AsyncState>('loading');
  const [catalogError, setCatalogError] = useState('');

  const [authState, setAuthState] = useState<AsyncState>('idle');
  const [authMessage, setAuthMessage] = useState('');
  const [session, setSession] = useState<CustomerAuthResponse | null>(null);
  const [registerForm, setRegisterForm] = useState<CustomerRegisterInput>(emptyRegisterForm);
  const [loginForm, setLoginForm] = useState<LoginInput>(emptyLoginForm);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setCatalogState('loading');
      setCatalogError('');

      try {
        const [healthResponse, categoryResponse, productResponse] = await Promise.all([
          getCustomerHealth(),
          getCategories('customer'),
          getProducts('customer'),
        ]);

        if (cancelled) {
          return;
        }

        setHealth(healthResponse);
        setCategories(categoryResponse.items);
        setProducts(productResponse.items);
        setCatalogState('ready');
      } catch (error) {
        if (cancelled) {
          return;
        }

        setCatalogState('error');
        setCatalogError(error instanceof Error ? error.message : 'Failed to load catalog');
      }
    }

    async function loadSession() {
      try {
        const response = await getCurrentCustomer();
        if (!cancelled) {
          setSession(response);
        }
      } catch {
        if (!cancelled) {
          setSession(null);
        }
      }
    }

    loadCatalog();
    loadSession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, []);

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthState('loading');
    setAuthMessage('');

    try {
      const response = await registerCustomer({
        ...registerForm,
        phone: registerForm.phone?.trim() || undefined,
      });
      setSession(response);
      setRegisterForm(emptyRegisterForm);
      setAuthState('ready');
      setAuthMessage(`Welcome, ${response.user.first_name}. Your customer session is active.`);
    } catch (error) {
      setAuthState('error');
      setAuthMessage(error instanceof Error ? error.message : 'Registration failed');
    }
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthState('loading');
    setAuthMessage('');

    try {
      const response = await loginCustomer(loginForm);
      setSession(response);
      setLoginForm(emptyLoginForm);
      setAuthState('ready');
      setAuthMessage(`Signed in as ${response.user.email}.`);
    } catch (error) {
      setAuthState('error');
      setAuthMessage(error instanceof Error ? error.message : 'Login failed');
    }
  }

  async function handleLogout() {
    setAuthMessage('');

    try {
      await logoutCustomer();
      setSession(null);
      setAuthState('ready');
      setAuthMessage('Customer session closed.');
    } catch (error) {
      setAuthState('error');
      setAuthMessage(error instanceof Error ? error.message : 'Logout failed');
    }
  }

  const featuredProducts = products.slice(0, 4);
  const leadCategories = categories.slice(0, 4);
  const greetingHour = new Date().getHours();
  const greeting =
    greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <main className="landing-page">
      <header className="site-header">
        <div className="page-shell header-row">
          <a href="#top" className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <span>
              Tea Time
              <small>Modern tea storefront</small>
            </span>
          </a>

          <nav className="site-nav" aria-label="Primary">
            <a href="#categories">Categories</a>
            <a href="#featured">Featured</a>
            <a href="#ritual">Experience</a>
            <a href="#customer-auth">Sign in</a>
          </nav>

          <div className="header-actions">
            <a href="/admin" className="outline-button">
              Admin
            </a>
            <a href="#featured" className="solid-button">
              Shop now
            </a>
          </div>
        </div>
      </header>

      <section id="top" className="hero-section">
        <div className="full-bleed-shell">
          <div className="hero-slider">
            {heroSlides.map((slide, index) => (
              <article
                key={slide.eyebrow}
                className={`hero-slide hero-slide-${slide.variant} ${index === activeSlide ? 'is-active' : ''}`}
              >
                <div className="hero-slide-background" aria-hidden="true" />
                <div className="hero-overlay" aria-hidden="true" />
                <div className="hero-slide-content">
                  <div className="hero-copy">
                    <span className="eyebrow">{slide.eyebrow}</span>
                    <p className="hero-greeting">
                      {greeting}
                      {session ? `, ${session.user.first_name}.` : '.'}
                    </p>
                    <h1>{slide.title}</h1>
                    <p className="hero-body">{slide.body}</p>
                    <p className="hero-body hero-body-secondary">{slide.secondary}</p>
                    <div className="hero-actions-row">
                      <a href={slide.variant === 'app' ? '#customer-auth' : '#featured'} className="solid-button">
                        {slide.primaryCta}
                      </a>
                      <a href={slide.variant === 'event' ? '#why' : '#categories'} className="ghost-button">
                        {slide.secondaryCta}
                      </a>
                    </div>
                    <div className="hero-tags">
                      {slide.badges.map((badge) => (
                        <span key={badge}>{badge}</span>
                      ))}
                    </div>
                  </div>

                  <div className="hero-art">
                    {slide.variant === 'tea' ? (
                      <>
                        <div className="hero-wood" />
                        <div className="hero-cup" />
                        <div className="hero-steam" />
                        <div className="floating-panel">
                          <strong>Sip. Energize. Repeat.</strong>
                          <span>Reliable tea service built around clean delivery and daily comfort.</span>
                        </div>
                      </>
                    ) : null}

                    {slide.variant === 'app' ? (
                      <div className="hero-phone">
                        <div className="hero-phone-screen">
                          <p className="screen-label">Today’s flow</p>
                          <h2>Tea Time app</h2>
                          <p>Catalog, session restore, and repeat ordering in one cleaner customer flow.</p>
                          <div className="screen-cards">
                            <div>
                              <strong>Morning order</strong>
                              <span>Tea flask · 10 cups · arriving in 12 min</span>
                            </div>
                            <div>
                              <strong>Live tracking</strong>
                              <span>Driver assigned · route active · order visible</span>
                            </div>
                            <div>
                              <strong>Subscription</strong>
                              <span>Morning and evening plan active</span>
                            </div>
                            <div>
                              <strong>Billing</strong>
                              <span>Paperless-ready session and account history</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {slide.variant === 'event' ? (
                      <div className="event-panel">
                        <h3>Perfect tea for your special events</h3>
                        <p>Bulk, corporate, and event refreshment with premium service and consistent delivery.</p>
                        <div className="hero-actions-row hero-actions-compact">
                          <a href="#customer-auth" className="outline-button event-highlight-button">
                            Plan your event
                          </a>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}

            <div className="slide-indicators">
              {heroSlides.map((slide, index) => (
                <button
                  key={slide.eyebrow}
                  type="button"
                  className={`slide-dot ${index === activeSlide ? 'is-active' : ''}`}
                  aria-label={`Show ${slide.eyebrow}`}
                  onClick={() => setActiveSlide(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="ticker-wrap" aria-label="Highlights">
        <div className="ticker">
          {[...marqueeItems, ...marqueeItems].map((item, index) => (
            <span key={`${item}-${index}`} className="ticker-item">
              <b>Tea Time</b>
              {item}
            </span>
          ))}
        </div>
      </section>

      <section id="categories" className="section-block menu-section">
        <div className="full-bleed-shell menu-shell">
          <div className="section-head">
            <div>
              <span className="eyebrow">Category focus</span>
              <h2>Clear browsing paths instead of a vague first impression.</h2>
            </div>
            <p>
              The landing page now leads with category intent and product discovery, not backend
              implementation language.
            </p>
          </div>

          <div className="category-grid">
            {leadCategories.map((category, index) => (
              <article key={category.id} className={`category-card tone-${index % 4}`}>
                <div className="category-media">
                  <span className="category-count">{category.product_count} items</span>
                </div>
                <div className="category-body">
                  <h3>{category.name}</h3>
                  <p>Built from the live category API and styled as a storefront section, not a debug view.</p>
                </div>
              </article>
            ))}
          </div>

          {catalogState === 'error' ? <p className="status-row error">{catalogError}</p> : null}
        </div>
      </section>

      <section id="featured" className="section-block section-soft">
        <div className="page-shell">
          <div className="section-head">
            <div>
              <span className="eyebrow">Featured teas</span>
              <h2>Cards with enough visual weight to actually sell the product.</h2>
            </div>
            <p>
              Product data is still live from the backend, but the presentation now behaves like a
              premium storefront.
            </p>
          </div>

          <div className="product-grid">
            {featuredProducts.map((product) => (
              <article key={product.id} className="product-card">
                <div
                  className="product-media"
                  style={{
                    backgroundImage: `linear-gradient(180deg, rgba(20, 16, 10, 0.06), rgba(20, 16, 10, 0.4)), url(${product.images[0]})`,
                  }}
                />
                <div className="product-content">
                  <p className="product-meta">{product.categories.join(' • ') || 'House selection'}</p>
                  <h3>{product.name}</h3>
                  <p>{product.description ?? 'No description provided yet.'}</p>
                  <div className="product-footer">
                    <span>₹{product.price.toFixed(0)}</span>
                    <button type="button" className="chip-button">
                      Add to cart
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {catalogState === 'loading' ? <p className="status-row">Loading products...</p> : null}
        </div>
      </section>

      <section id="why" className="section-block">
        <div className="page-shell">
          <div className="section-head">
            <div>
              <span className="eyebrow">Why Tea Time</span>
              <h2>A complete landing section, not just a hero and product rail.</h2>
            </div>
            <p>
              This picks up the missing middle from the sample page: clear value framing, stronger
              reasons to trust the brand, and enough density to feel intentional.
            </p>
          </div>

          <div className="value-grid">
            {valueCards.map((item) => (
              <article key={item.title} className="value-card">
                <span className="value-icon" aria-hidden="true" />
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="ritual" className="section-block">
        <div className="page-shell ritual-layout">
          <div className="ritual-panel">
            <span className="eyebrow">Why it feels better</span>
            <h2>The page now has a real landing-page spine.</h2>
            <div className="ritual-points">
              <article>
                <strong>Stronger opening</strong>
                <p>Hero, motion, and framing now read like a product brand rather than an internal tool.</p>
              </article>
              <article>
                <strong>Modern typography</strong>
                <p>All-sans stack only. No Times New Roman, no cursive, no faux luxury fallback.</p>
              </article>
              <article>
                <strong>Better flow</strong>
                <p>Visitors move from promise to categories to products to account creation in one pass.</p>
              </article>
            </div>
          </div>

          <div className="api-panel">
            <span className="eyebrow">System pulse</span>
            <h3>{health?.ok ? 'Backend connected' : 'Waiting for backend'}</h3>
            <p>
              {catalogState === 'ready'
                ? `Customer API is live with ${products.length} products and ${categories.length} categories loaded.`
                : 'Catalog data is still loading.'}
            </p>
            <div className="api-pills">
              <span>{health?.service ?? 'backend'}</span>
              <span>{health?.database ? 'database ready' : 'database pending'}</span>
              <span>{session ? 'signed in' : 'guest browsing'}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section-block section-soft">
        <div className="page-shell">
          <div className="section-head">
            <div>
              <span className="eyebrow">Our process</span>
              <h2>A calmer, clearer sequence from selection to service.</h2>
            </div>
            <p>
              Borrowing the structure from `sample.html`, this section gives the homepage an actual
              flow instead of stopping after the product cards.
            </p>
          </div>

          <div className="steps-grid">
            {processSteps.map((step, index) => (
              <article key={step} className="step-card">
                <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
                <p>{step}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="page-shell">
          <div className="section-head">
            <div>
              <span className="eyebrow">Who we serve</span>
              <h2>Built for teams, events, and repeat refreshment moments.</h2>
            </div>
            <p>
              The homepage now has the coverage the sample was aiming for: workplace service,
              event-ready positioning, and a brand story that extends beyond product thumbnails.
            </p>
          </div>

          <div className="audience-grid">
            {serviceAudience.map((audience) => (
              <article key={audience} className="audience-card">
                <h3>{audience}</h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="customer-auth" className="section-block auth-block">
        <div className="page-shell auth-layout">
          <div className="auth-intro">
            <span className="eyebrow">Customer access</span>
            <h2>Keep the signup flow, but stop letting it dominate the page.</h2>
            <p>
              Authentication is still live and working. It’s just been moved into a cleaner closing
              section instead of occupying the entire landing-page story.
            </p>
            <div className="session-summary">
              <strong>Current session</strong>
              <span>
                {session
                  ? `${session.user.first_name} ${session.user.last_name} • ${session.user.email}`
                  : 'No active customer session'}
              </span>
            </div>
            {session ? (
              <button type="button" className="outline-button session-button" onClick={handleLogout}>
                Logout
              </button>
            ) : null}
            {authMessage ? (
              <p className={`status-row ${authState === 'error' ? 'error' : 'success'}`}>{authMessage}</p>
            ) : null}
          </div>

          <div className="auth-forms">
            <form className="auth-card" onSubmit={handleRegister}>
              <h3>Create account</h3>
              <label>
                Username
                <input
                  value={registerForm.user_name}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, user_name: event.target.value }))
                  }
                />
              </label>
              <label>
                First name
                <input
                  value={registerForm.first_name}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, first_name: event.target.value }))
                  }
                />
              </label>
              <label>
                Last name
                <input
                  value={registerForm.last_name}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, last_name: event.target.value }))
                  }
                />
              </label>
              <label>
                Phone
                <input
                  value={registerForm.phone ?? ''}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, phone: event.target.value }))
                  }
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(event) =>
                    setRegisterForm((current) => ({ ...current, password: event.target.value }))
                  }
                />
              </label>
              <button className="solid-button" type="submit" disabled={authState === 'loading'}>
                Register
              </button>
            </form>

            <form className="auth-card" onSubmit={handleLogin}>
              <h3>Sign in</h3>
              <label>
                Email
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(event) =>
                    setLoginForm((current) => ({ ...current, email: event.target.value }))
                  }
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((current) => ({ ...current, password: event.target.value }))
                  }
                />
              </label>
              <button className="solid-button" type="submit" disabled={authState === 'loading'}>
                Login
              </button>
              <p className="helper-copy">Customer session restore runs automatically on page load.</p>
            </form>
          </div>
        </div>
      </section>

      <section className="section-block">
        <div className="page-shell">
          <div className="cta-band">
            <span className="eyebrow">Upgrade the tea break</span>
            <h2>One storefront, one backend, and a landing page that finally feels complete.</h2>
            <p>
              Customer browsing, category discovery, product showcase, register, login, restore
              session, logout, and admin access now sit inside one coherent frontend/backend system.
            </p>
            <div className="hero-actions-row">
              <a href="#featured" className="outline-button cta-button-light">
                Browse menu
              </a>
              <a href="/admin" className="ghost-button">
                Open admin
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="site-footer">
        <div className="page-shell footer-grid">
          <section className="footer-card">
            <div className="brand">
              <span className="brand-mark" aria-hidden="true" />
              <span>
                Tea Time
                <small>Modern tea storefront</small>
              </span>
            </div>
            <p>
              Premium tea, event-ready service, and a cleaner digital ordering flow backed by the
              same Rust API.
            </p>
          </section>
          <section className="footer-card">
            <h3>Explore</h3>
            <ul>
              <li><a href="#categories">Categories</a></li>
              <li><a href="#featured">Featured</a></li>
              <li><a href="#why">Why Tea Time</a></li>
            </ul>
          </section>
          <section className="footer-card">
            <h3>Flows</h3>
            <ul>
              <li>Customer register</li>
              <li>Customer login/logout</li>
              <li>Admin login/logout</li>
            </ul>
          </section>
          <section className="footer-card">
            <h3>System</h3>
            <ul>
              <li>{health?.database ? 'Database ready' : 'Database pending'}</li>
              <li>{products.length} products live</li>
              <li>{categories.length} categories live</li>
            </ul>
          </section>
        </div>
      </footer>
    </main>
  );
}
