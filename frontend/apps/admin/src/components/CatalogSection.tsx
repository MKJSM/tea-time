import type { ChangeEvent, FormEvent } from 'react';

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
              Manage product cards, category links, and image uploads from one place.
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
