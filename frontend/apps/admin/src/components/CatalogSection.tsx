import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';

import type { CategoryListItem, ProductListItem } from '@tea-time/types';

import { formatMoney } from '../lib/format';

export interface CategoryFormState {
  id: string;
  name: string;
  slug: string;
  imagesText: string;
}

export interface ProductFormState {
  id: string;
  name: string;
  imagesText: string;
  price: string;
  description: string;
  rating: string;
  origin: string;
  caffeine: string;
  format: string;
  story: string;
  tagsText: string;
  flavorProfileText: string;
  brewingGuideText: string;
  customizationGroupsText: string;
  categoryIds: string[];
}

interface CategoriesProps {
  categories: CategoryListItem[];
  onEditCategory: (category: CategoryListItem) => void;
  onDeleteCategory: (id: string) => void;
  onAddCategory: () => void;
}

interface ProductsProps {
  categories: CategoryListItem[];
  products: ProductListItem[];
  onEditProduct: (product: ProductListItem) => void;
  onDeleteProduct: (id: string) => void;
  onAddProduct: () => void;
}

function parseImageCount(images: string[]) {
  return images.length;
}

interface ProductCategoryPickerProps {
  categories: CategoryListItem[];
  selectedIds: string[];
  onChange: (categoryIds: string[]) => void;
}

export function ProductCategoryPicker({ categories, selectedIds, onChange }: ProductCategoryPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleDocumentMouseDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleDocumentMouseDown);
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown);
  }, []);

  const selectedCategories = useMemo(
    () => categories.filter((category) => selectedIds.includes(category.id)),
    [categories, selectedIds],
  );

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return categories;
    return categories.filter((category) => {
      return `${category.name} ${category.slug}`.toLowerCase().includes(normalizedQuery);
    });
  }, [categories, query]);

  function toggleCategory(categoryId: string) {
    const nextIds = selectedIds.includes(categoryId)
      ? selectedIds.filter((id) => id !== categoryId)
      : [...selectedIds, categoryId];
    onChange(nextIds);
  }

  function removeCategory(categoryId: string) {
    onChange(selectedIds.filter((id) => id !== categoryId));
  }

  return (
    <div className="product-category-picker" ref={rootRef}>
      <div className="editor-chip-row product-category-picker__chips">
        {selectedCategories.length ? (
          selectedCategories.map((category) => (
            <span key={category.id} className="status-chip is-active product-category-chip">
              {category.name}
              <button
                type="button"
                className="chip-remove-btn"
                onClick={() => removeCategory(category.id)}
                aria-label={`Remove ${category.name}`}
              >
                ×
              </button>
            </span>
          ))
        ) : (
          <span className="type-chip product-category-placeholder">No categories selected</span>
        )}
      </div>

      <div className="product-category-picker__toolbar">
        <button
          type="button"
          className="product-category-picker__trigger"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          onClick={() => setIsOpen((current) => !current)}
        >
          <span>
            {selectedCategories.length ? `${selectedCategories.length} selected` : 'Select categories'}
          </span>
          <span aria-hidden="true">▾</span>
        </button>
        {selectedIds.length ? (
          <button
            type="button"
            className="product-category-picker__clear"
            onClick={() => onChange([])}
          >
            Clear
          </button>
        ) : null}
      </div>

      {isOpen ? (
        <div className="product-category-picker__panel">
          <label className="product-category-picker__search">
            Search categories
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a category name or slug"
            />
          </label>

          <div className="product-category-picker__list" role="listbox" aria-multiselectable="true">
            {filteredCategories.length ? (
              filteredCategories.map((category) => {
                const checked = selectedIds.includes(category.id);
                return (
                  <label key={category.id} className="product-category-option">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleCategory(category.id)}
                    />
                    <span className="product-category-option__meta">
                      <strong>{category.name}</strong>
                      <small>{category.slug}</small>
                    </span>
                  </label>
                );
              })
            ) : (
              <p className="field-hint product-category-empty">No matching categories found.</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function CategoriesSection({
  categories,
  onEditCategory,
  onDeleteCategory,
  onAddCategory,
}: CategoriesProps) {
  return (
    <section className="admin-page-section" id="admin-categories">
      <article className="admin-card">
        <div className="section-card-head">
          <div>
            <p className="section-kicker">Catalog</p>
            <h2>Categories</h2>
            <p className="section-copy">
              Keep the category catalog organized, image-backed, and easy to edit.
            </p>
          </div>
          <button className="add-button" onClick={onAddCategory}>
            <span>+</span> Add Category
          </button>
        </div>

        <div className="admin-table">
          <div className="admin-table-head">
            <span>Name</span>
            <span>Images</span>
            <span>Products</span>
            <span>Actions</span>
          </div>
          {categories.map((category) => (
            <div key={category.id} className="admin-table-row">
              <div>
                <strong>{category.name}</strong>
                <br />
                <code>{category.slug}</code>
              </div>
              <span>{parseImageCount(category.images)}</span>
              <span>{category.product_count}</span>
              <div className="row-actions">
                <button type="button" onClick={() => onEditCategory(category)}>
                  Edit
                </button>
                <button type="button" className="danger" onClick={() => onDeleteCategory(category.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

export function ProductsSection({
  categories,
  products,
  onEditProduct,
  onDeleteProduct,
  onAddProduct,
}: ProductsProps) {
  return (
    <section className="admin-page-section" id="admin-products">
      <article className="admin-card">
        <div className="section-card-head">
          <div>
            <p className="section-kicker">Catalog</p>
            <h2>Products</h2>
            <p className="section-copy">
              Manage product cards, category links, and image uploads from one place across{' '}
              {categories.length} categories.
            </p>
          </div>
          <button className="add-button" onClick={onAddProduct}>
            <span>+</span> Add Product
          </button>
        </div>

        <div className="admin-table">
          <div className="admin-table-head">
            <span>Name</span>
            <span>Price</span>
            <span>Categories</span>
            <span>Actions</span>
          </div>
          {products.map((product) => (
            <div key={product.id} className="admin-table-row">
              <strong>{product.name}</strong>
              <span>{formatMoney(product.price)}</span>
              <span>{product.categories.join(', ') || 'Unassigned'}</span>
              <div className="row-actions">
                <button type="button" onClick={() => onEditProduct(product)}>
                  Edit
                </button>
                <button type="button" className="danger" onClick={() => onDeleteProduct(product.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </article>
    </section>
  );
}

interface CatalogProps extends CategoriesProps, ProductsProps { }

export function CatalogSection(props: CatalogProps) {
  return (
    <div className="catalog-stack">
      <CategoriesSection
        categories={props.categories}
        onEditCategory={props.onEditCategory}
        onDeleteCategory={props.onDeleteCategory}
        onAddCategory={props.onAddCategory}
      />
      <ProductsSection
        categories={props.categories}
        products={props.products}
        onEditProduct={props.onEditProduct}
        onDeleteProduct={props.onDeleteProduct}
        onAddProduct={props.onAddProduct}
      />
    </div>
  );
}
