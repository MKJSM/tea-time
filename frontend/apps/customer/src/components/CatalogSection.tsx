import type { CategoryListItem, ProductListItem } from '@tea-time/types';
import { formatMoney } from '../lib/format';

type AsyncState = 'idle' | 'loading' | 'ready' | 'error';

interface Props {
  categories: CategoryListItem[];
  products: ProductListItem[];
  selectedCategoryId: string;
  catalogState: AsyncState;
  catalogMessage: string;
  busyProductId: string | null;
  onCategorySelect: (categoryId: string) => void;
  onAddToCart: (productId: string) => void;
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
      {catalogState === 'error' ? (
        <p className="form-message error">{catalogMessage}</p>
      ) : null}

      <div className="catalog-grid">
        {products.map((product) => (
          <article key={product.id} className="product-card">
            <div className="product-media">
              {product.images[0] ? (
                <img src={product.images[0]} alt={product.name} />
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
              <div className="product-tags">
                {product.categories.map((c) => (
                  <span key={`${product.id}-${c}`} className="product-tag">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div className="product-footer">
              <button
                className="solid-button"
                type="button"
                onClick={() => onAddToCart(product.id)}
                disabled={busyProductId === product.id}
              >
                {busyProductId === product.id ? 'Adding…' : 'Add to cart'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
