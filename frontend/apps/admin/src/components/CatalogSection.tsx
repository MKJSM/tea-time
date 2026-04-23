import type { ChangeEvent, FormEvent } from 'react';

import type { CategoryListItem, ProductListItem } from '@tea-time/types';

import { formatMoney } from '../lib/format';

export interface CategoryFormState {
  id: string;
  name: string;
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
  categoryForm: CategoryFormState;
  onCategoryFormChange: (patch: Partial<CategoryFormState>) => void;
  onSubmitCategory: (event: FormEvent<HTMLFormElement>) => void;
  onEditCategory: (category: CategoryListItem) => void;
  onDeleteCategory: (id: string) => void;
  onFileAppend: (event: ChangeEvent<HTMLInputElement>) => void;
}

interface ProductsProps {
  categories: CategoryListItem[];
  products: ProductListItem[];
  productForm: ProductFormState;
  onProductFormChange: (patch: Partial<ProductFormState>) => void;
  onSubmitProduct: (event: FormEvent<HTMLFormElement>) => void;
  onEditProduct: (product: ProductListItem) => void;
  onDeleteProduct: (id: string) => void;
  onFileAppend: (event: ChangeEvent<HTMLInputElement>) => void;
}

function parseImageCount(images: string[]) {
  return images.length;
}

export function CategoriesSection({
  categories,
  categoryForm,
  onCategoryFormChange,
  onSubmitCategory,
  onEditCategory,
  onDeleteCategory,
  onFileAppend,
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
        </div>

        <form className="admin-form admin-form--tight" onSubmit={onSubmitCategory}>
          <label>
            Name
            <input
              value={categoryForm.name}
              onChange={(e) => onCategoryFormChange({ name: e.target.value })}
              placeholder="Black Tea"
            />
          </label>
          <label>
            Image URLs
            <textarea
              value={categoryForm.imagesText}
              onChange={(e) => onCategoryFormChange({ imagesText: e.target.value })}
              placeholder="One image URL per line"
            />
          </label>
          <label className="upload-field">
            Upload image
            <input type="file" accept="image/*" onChange={onFileAppend} />
          </label>
          <button type="submit">{categoryForm.id ? 'Update category' : 'Create category'}</button>
        </form>

        <div className="admin-table">
          <div className="admin-table-head">
            <span>Name</span>
            <span>Images</span>
            <span>Products</span>
            <span>Actions</span>
          </div>
          {categories.map((category) => (
            <div key={category.id} className="admin-table-row">
              <strong>{category.name}</strong>
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
  productForm,
  onProductFormChange,
  onSubmitProduct,
  onEditProduct,
  onDeleteProduct,
  onFileAppend,
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
        </div>

        <form className="admin-form admin-form--tight" onSubmit={onSubmitProduct}>
          <label>
            Name
            <input
              value={productForm.name}
              onChange={(e) => onProductFormChange({ name: e.target.value })}
              placeholder="Masala Ember"
            />
          </label>
          <label>
            Price
            <input
              type="number"
              min="0"
              step="0.01"
              value={productForm.price}
              onChange={(e) => onProductFormChange({ price: e.target.value })}
            />
          </label>
          <label>
            Description
            <textarea
              value={productForm.description}
              onChange={(e) => onProductFormChange({ description: e.target.value })}
            />
          </label>
          <label>
            Category links
            <select
              multiple
              value={productForm.categoryIds}
              onChange={(e) =>
                onProductFormChange({
                  categoryIds: Array.from(e.target.selectedOptions, (option) => option.value),
                })
              }
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Image URLs
            <textarea
              value={productForm.imagesText}
              onChange={(e) => onProductFormChange({ imagesText: e.target.value })}
              placeholder="One image URL per line"
            />
          </label>
          <label className="upload-field">
            Upload image
            <input type="file" accept="image/*" onChange={onFileAppend} />
          </label>
          <button type="submit">{productForm.id ? 'Update product' : 'Create product'}</button>
        </form>

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

interface CatalogProps extends CategoriesProps, ProductsProps {}

export function CatalogSection(props: CatalogProps) {
  return (
    <div className="catalog-stack">
      <CategoriesSection
        categories={props.categories}
        categoryForm={props.categoryForm}
        onCategoryFormChange={props.onCategoryFormChange}
        onSubmitCategory={props.onSubmitCategory}
        onEditCategory={props.onEditCategory}
        onDeleteCategory={props.onDeleteCategory}
        onFileAppend={props.onFileAppend}
      />
      <ProductsSection
        categories={props.categories}
        products={props.products}
        productForm={props.productForm}
        onProductFormChange={props.onProductFormChange}
        onSubmitProduct={props.onSubmitProduct}
        onEditProduct={props.onEditProduct}
        onDeleteProduct={props.onDeleteProduct}
        onFileAppend={props.onFileAppend}
      />
    </div>
  );
}
