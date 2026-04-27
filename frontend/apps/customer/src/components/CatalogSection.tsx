import React, { useRef } from 'react';
import type { CategoryListItem, ProductListItem } from '@tea-time/types';
import { formatMoney } from '../lib/format';
import { useAutoScroll } from '../lib/autoScroll';
import { buildProductPath } from '../lib/catalog';

type AsyncState = 'idle' | 'loading' | 'ready' | 'error';

interface Props {
  categories: CategoryListItem[];
  products: ProductListItem[];
  selectedCategoryId: string;
  catalogState: AsyncState;
  catalogMessage: string;
  busyProductId?: string | null;
  onCategorySelect: (categoryId: string) => void;
  onAddToCart?: (productId: string) => void;
}

export function CatalogSection({
  categories,
  products,
  selectedCategoryId,
  catalogState,
  catalogMessage,
  busyProductId,
  onCategorySelect,
  onAddToCart,
}: Props) {
  return (
    <section className="container stacked-section" id="catalog">
      <div className="section-head">
        <div>
          <span className="eyebrow">Catalog</span>
          <h2>Browse products and add to cart.</h2>
        </div>
        <p>Filter by category, add items to the cart, and move directly into checkout.</p>
      </div>

      <div className="category-chips">
        <button
          type="button"
          className={`chip-button${selectedCategoryId === 'all' ? ' is-active' : ''}`}
          onClick={() => onCategorySelect('all')}
        >
          All products
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`chip-button${selectedCategoryId === cat.id ? ' is-active' : ''}`}
            onClick={() => onCategorySelect(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {catalogState === 'loading' ? <p className="helper-copy">Loading products…</p> : null}
      {catalogMessage ? (
        <p className={catalogState === 'error' ? 'form-message error' : 'helper-copy'}>
          {catalogMessage}
        </p>
      ) : null}
      {catalogState === 'ready' && !products.length ? (
        <p className="helper-copy">No products are available in this view yet.</p>
      ) : null}

      <div className="catalog-grid">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            isBusy={busyProductId === product.id}
          />
        ))}
      </div>
    </section>
  );
}

function ProductCard({
  product,
  onAddToCart,
  isBusy,
}: {
  product: ProductListItem;
  onAddToCart?: (id: string) => void;
  isBusy: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  useAutoScroll(scrollerRef, product.images.length);

  return (
    <article className="product-card">
      <a className="product-card-link" href={buildProductPath(product.id)}>
        <div className="product-media">
          {product.images.length > 0 ? (
            <div className="image-scroller" ref={scrollerRef}>
              {product.images.map((url, i) => (
                <img key={`${product.id}-img-${i}`} src={url} alt={product.name} />
              ))}
              {product.images.length > 1 && (
                <div className="scroller-dots">
                  {product.images.map((_, i) => (
                    <div key={i} className="scroller-dot" />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="product-placeholder">{product.name.slice(0, 1)}</div>
          )}
        </div>
        <div className="product-content">
          <div className="product-title-row">
            <h3>{product.name}</h3>
            <strong>{formatMoney(product.price)}</strong>
          </div>
          <p>{product.description ?? 'Freshly prepared and ready for repeat ordering.'}</p>
          <div className="product-meta-row">
            <span>{product.rating.toFixed(1)} rating</span>
            <span>{product.origin ?? 'House blend'}</span>
          </div>
          <div className="product-tags">
            {product.categories.map((c) => (
              <span key={`${product.id}-${c}`} className="product-tag">
                {c}
              </span>
            ))}
            {product.tags.slice(0, 2).map((tag) => (
              <span key={`${product.id}-${tag}`} className="product-tag is-soft">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </a>
      {onAddToCart ? (
        <div className="product-footer">
          <button
            className="solid-button"
            type="button"
            onClick={() => onAddToCart(product.id)}
            disabled={isBusy}
          >
            {isBusy ? 'Adding…' : 'Add to cart'}
          </button>
        </div>
      ) : null}
    </article>
  );
}
