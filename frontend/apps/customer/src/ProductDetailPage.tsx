import { useEffect, useMemo, useState } from 'react';

import { addCartItem, getProduct, getProducts } from '@tea-time/api-client';
import type { ProductDetail, ProductListItem } from '@tea-time/types';

import { buildProductPath } from './lib/catalog';
import { formatMoney } from './lib/format';
import { useSiteTheme } from './lib/theme';

type AsyncState = 'idle' | 'loading' | 'ready' | 'error';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function readProductId() {
  if (typeof window === 'undefined') return '';
  const [, , id] = window.location.pathname.split('/');
  return id ?? '';
}

function collectGroupOptionIds(product: ProductDetail, groupId: string) {
  return (
    product.customization_groups.find((group) => group.id === groupId)?.options.map((option) => option.id) ??
    []
  );
}

function formatCustomizationLabel(product: ProductDetail, selectedOptionIds: string[]) {
  const selected = product.customization_groups
    .flatMap((group) =>
      group.options
        .filter((option) => selectedOptionIds.includes(option.id))
        .map((option) => `${group.name}: ${option.name}`),
    )
    .filter(Boolean);
  return selected.length ? selected.join(' · ') : 'No customizations selected';
}

export function ProductDetailPage() {
  const { theme, toggleTheme } = useSiteTheme();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [catalog, setCatalog] = useState<ProductListItem[]>([]);
  const [state, setState] = useState<AsyncState>('loading');
  const [message, setMessage] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([]);
  const [busyAction, setBusyAction] = useState<'cart' | 'buy' | null>(null);
  const productId = useMemo(readProductId, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState('loading');
      setMessage('');

      try {
        const [productResult, catalogResult] = await Promise.allSettled([
          getProduct(productId),
          getProducts('customer'),
        ]);

        if (cancelled) return;

        if (productResult.status === 'fulfilled') {
          setProduct(productResult.value);
          setActiveImageIndex(0);
          const initialSelections = productResult.value.customization_groups.flatMap((group) =>
            group.min_select > 0 ? group.options.slice(0, group.min_select).map((option) => option.id) : [],
          );
          setSelectedOptionIds(initialSelections);
          setState('ready');
        } else {
          setProduct(null);
          setState('error');
          setMessage(getErrorMessage(productResult.reason));
          return;
        }

        if (catalogResult.status === 'fulfilled') {
          setCatalog(catalogResult.value.items);
        } else {
          setCatalog([]);
        }
      } catch (error) {
        if (cancelled) return;
        setState('error');
        setMessage(getErrorMessage(error));
      }
    }

    if (productId) {
      void load();
    } else {
      setState('error');
      setMessage('Product not found.');
    }

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const selectedProduct = product;
  const selectedOptionMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!selectedProduct) return map;

    selectedProduct.customization_groups.forEach((group) => {
      group.options.forEach((option) => {
        map.set(option.id, option.price_delta);
      });
    });
    return map;
  }, [selectedProduct]);

  const customizationPrice = selectedOptionIds.reduce(
    (total, optionId) => total + (selectedOptionMap.get(optionId) ?? 0),
    0,
  );
  const unitPrice = (selectedProduct?.price ?? 0) + customizationPrice;
  const relatedProducts = useMemo(() => {
    if (!selectedProduct) return [];
    const categorySet = new Set(selectedProduct.category_ids);
    return catalog
      .filter((item) => item.id !== selectedProduct.id)
      .map((item) => ({
        item,
        score: item.category_ids.reduce((total, categoryId) => total + (categorySet.has(categoryId) ? 1 : 0), 0),
      }))
      .filter(({ score }) => score > 0)
      .sort((left, right) => right.score - left.score)
      .map(({ item }) => item)
      .slice(0, 4);
  }, [catalog, selectedProduct]);

  function toggleOption(groupId: string, optionId: string) {
    if (!selectedProduct) return;

    const group = selectedProduct.customization_groups.find((item) => item.id === groupId);
    if (!group) return;

    setSelectedOptionIds((current) => {
      const groupOptionIds = collectGroupOptionIds(selectedProduct, groupId);
      const currentlySelected = current.filter((id) => groupOptionIds.includes(id));

      if (currentlySelected.includes(optionId)) {
        if (currentlySelected.length <= group.min_select) {
          return current;
        }
        return current.filter((id) => id !== optionId);
      }

      if (group.max_select === 1) {
        const withoutGroup = current.filter((id) => !groupOptionIds.includes(id));
        return [...withoutGroup, optionId];
      }

      if (currentlySelected.length >= group.max_select) {
        return current;
      }

      return [...current, optionId];
    });
  }

  async function addToCart(redirectAfterAdd: boolean) {
    if (!selectedProduct) return;
    setBusyAction(redirectAfterAdd ? 'buy' : 'cart');
    setMessage('');
    try {
      await addCartItem({
        product_id: selectedProduct.id,
        quantity,
        selected_customization_option_ids: selectedOptionIds,
      });
      if (redirectAfterAdd) {
        window.location.assign('/#cart');
        return;
      }
      setMessage('Product added to cart.');
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <main className="landing-page product-detail-page">
      <header className="site-header">
        <div className="container header-row">
          <a className="brand" href="/">
            <img src="/assets/logo.webp" alt="Mobilitea Logo" className="logo" />
          </a>
          <nav className="site-nav">
            <a href="/">Home</a>
            <a href="/products">Products</a>
            <a href="/#ritual">Process</a>
            <a href="/#contact">Contact</a>
          </nav>
          <div className="header-actions">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <a className="solid-button" href="/#categories">
              Subscribe
            </a>
          </div>
        </div>
      </header>

      {state === 'loading' ? <section className="container product-detail-state">Loading product…</section> : null}
      {state === 'error' ? (
        <section className="container product-detail-state">
          <p className="form-message error">{message || 'Failed to load product.'}</p>
          <a className="outline-button" href="/products">
            Back to products
          </a>
        </section>
      ) : null}

      {state === 'ready' && selectedProduct ? (
        <>
          <section className="container product-detail-hero">
            <div className="product-detail-gallery">
              {selectedProduct.images.length > 0 ? (
                <>
                  <div className="product-detail-main-image">
                    <img
                      src={selectedProduct.images[activeImageIndex] ?? selectedProduct.images[0]}
                      alt={selectedProduct.name}
                    />
                  </div>
                  {selectedProduct.images.length > 1 ? (
                    <div className="product-detail-thumbs">
                      {selectedProduct.images.map((image, index) => (
                        <button
                          key={`${selectedProduct.id}-${index}`}
                          type="button"
                          className={`product-detail-thumb${
                            index === activeImageIndex ? ' is-active' : ''
                          }`}
                          onClick={() => setActiveImageIndex(index)}
                        >
                          <img src={image} alt="" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="product-detail-placeholder">{selectedProduct.name.slice(0, 1)}</div>
              )}
            </div>

            <aside className="product-detail-sidebar">
              <div className="product-detail-meta">
                <span className="eyebrow">Tea detail</span>
                <h1>{selectedProduct.name}</h1>
                <p>{selectedProduct.description ?? 'A brewed product with a clear story and repeatable ritual.'}</p>
                <div className="product-detail-rating-row">
                  <strong>{selectedProduct.rating.toFixed(1)}</strong>
                  <span>Rating</span>
                </div>
              </div>

              <div className="product-detail-price-block">
                <div>
                  <span>Base price</span>
                  <strong>{formatMoney(selectedProduct.price)}</strong>
                </div>
                <div>
                  <span>Current total</span>
                  <strong>{formatMoney(unitPrice)}</strong>
                </div>
              </div>

              <div className="product-detail-chip-row">
                {selectedProduct.categories.map((category) => (
                  <span key={`${selectedProduct.id}-${category}`} className="product-detail-chip">
                    {category}
                  </span>
                ))}
                {selectedProduct.tags.map((tag) => (
                  <span key={`${selectedProduct.id}-${tag}`} className="product-detail-chip is-ghost">
                    {tag}
                  </span>
                ))}
              </div>

              <dl className="product-detail-specs">
                <div>
                  <dt>Origin</dt>
                  <dd>{selectedProduct.origin ?? 'House blend'}</dd>
                </div>
                <div>
                  <dt>Caffeine</dt>
                  <dd>{selectedProduct.caffeine ?? 'Not listed'}</dd>
                </div>
                <div>
                  <dt>Format</dt>
                  <dd>{selectedProduct.format ?? 'Loose leaf'}</dd>
                </div>
                <div>
                  <dt>Flavor profile</dt>
                  <dd>{selectedProduct.flavor_profile.join(', ') || 'Balanced'}</dd>
                </div>
              </dl>

              <div className="product-customizer">
                <div className="section-head compact">
                  <div>
                    <span className="eyebrow">Customize</span>
                    <h2>Set the cup the way you want it.</h2>
                  </div>
                </div>

                <div className="customization-groups">
                  {selectedProduct.customization_groups.map((group) => (
                    <article key={group.id} className="customization-group">
                      <div className="customization-group-head">
                        <div>
                          <strong>{group.name}</strong>
                          {group.description ? <p>{group.description}</p> : null}
                        </div>
                        <span className="customization-limit">
                          {group.min_select === group.max_select
                            ? `${group.max_select} required`
                            : `${group.min_select}-${group.max_select} choices`}
                        </span>
                      </div>
                      <div className="customization-option-grid">
                        {group.options.map((option) => {
                          const isSelected = selectedOptionIds.includes(option.id);
                          return (
                            <button
                              key={option.id}
                              type="button"
                              className={`customization-option${isSelected ? ' is-selected' : ''}`}
                              onClick={() => toggleOption(group.id, option.id)}
                            >
                              <span>{option.name}</span>
                              <small>
                                {option.price_delta > 0
                                  ? `+ ${formatMoney(option.price_delta)}`
                                  : 'Included'}
                              </small>
                            </button>
                          );
                        })}
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="quantity-row">
                <label>
                  Quantity
                  <div className="quantity-stepper">
                    <button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))}>
                      -
                    </button>
                    <span>{quantity}</span>
                    <button type="button" onClick={() => setQuantity((current) => current + 1)}>
                      +
                    </button>
                  </div>
                </label>
              </div>

              <p className="product-customization-summary">
                {formatCustomizationLabel(selectedProduct, selectedOptionIds)}
              </p>

              <div className="product-detail-actions">
                <button
                  className="solid-button"
                  type="button"
                  onClick={() => void addToCart(false)}
                  disabled={busyAction !== null}
                >
                  {busyAction === 'cart' ? 'Adding…' : 'Add to cart'}
                </button>
                <button
                  className="outline-button"
                  type="button"
                  onClick={() => void addToCart(true)}
                  disabled={busyAction !== null}
                >
                  {busyAction === 'buy' ? 'Preparing…' : 'Buy now'}
                </button>
              </div>

              {message ? <p className="form-message">{message}</p> : null}
            </aside>
          </section>

          <section className="container product-detail-story-grid">
            <article className="panel">
              <span className="eyebrow">Story</span>
              <h2>About the blend</h2>
              <p>{selectedProduct.story ?? selectedProduct.description ?? 'No story available yet.'}</p>
            </article>

            <article className="panel">
              <span className="eyebrow">Flavor profile</span>
              <h2>Tasting notes</h2>
              <div className="token-list">
                {selectedProduct.flavor_profile.map((item) => (
                  <span key={`${selectedProduct.id}-${item}`} className="token-chip">
                    {item}
                  </span>
                ))}
              </div>
            </article>

            <article className="panel">
              <span className="eyebrow">Brewing guide</span>
              <h2>How to brew it</h2>
              <ol className="guide-list">
                {selectedProduct.brewing_guide.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </article>
          </section>

          <section className="container product-related-section">
            <div className="section-head">
              <div>
                <span className="eyebrow">Related products</span>
                <h2>More teas with similar notes.</h2>
              </div>
              <p>We matched these picks using shared categories from the catalog.</p>
            </div>
            {relatedProducts.length ? (
              <div className="related-grid">
                {relatedProducts.map((item) => (
                  <a key={item.id} className="related-card" href={buildProductPath(item.id)}>
                    <div className="related-card-media">
                      {item.images[0] ? <img src={item.images[0]} alt={item.name} /> : null}
                    </div>
                    <div className="related-card-body">
                      <strong>{item.name}</strong>
                      <span>{formatMoney(item.price)}</span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="helper-copy">No closely related products available yet.</p>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
