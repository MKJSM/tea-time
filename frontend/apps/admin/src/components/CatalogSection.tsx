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

interface Props {
  categories: CategoryListItem[];
  products: ProductListItem[];
  categoryForm: CategoryFormState;
  productForm: ProductFormState;
  onCategoryFormChange: (patch: Partial<CategoryFormState>) => void;
  onProductFormChange: (patch: Partial<ProductFormState>) => void;
  onSubmitCategory: (event: React.FormEvent<HTMLFormElement>) => void;
  onSubmitProduct: (event: React.FormEvent<HTMLFormElement>) => void;
  onEditCategory: (category: CategoryListItem) => void;
  onEditProduct: (product: ProductListItem) => void;
  onDeleteCategory: (id: string) => void;
  onDeleteProduct: (id: string) => void;
  onFileAppend: (
    event: React.ChangeEvent<HTMLInputElement>,
    target: 'category' | 'product',
  ) => void;
}

export function CatalogSection({
  categories,
  products,
  categoryForm,
  productForm,
  onCategoryFormChange,
  onProductFormChange,
  onSubmitCategory,
  onSubmitProduct,
  onEditCategory,
  onEditProduct,
  onDeleteCategory,
  onDeleteProduct,
  onFileAppend,
}: Props) {
  return (
    <section className="admin-grid" id="admin-catalog">
      {/* Categories */}
      <article className="admin-card">
        <h2>Categories</h2>
        <form className="admin-form" onSubmit={onSubmitCategory}>
          <label>
            Name
            <input
              value={categoryForm.name}
              onChange={(e) => onCategoryFormChange({ name: e.target.value })}
            />
          </label>
          <label>
            Image URLs
            <textarea
              value={categoryForm.imagesText}
              onChange={(e) => onCategoryFormChange({ imagesText: e.target.value })}
            />
          </label>
          <label className="upload-field">
            Upload image
            <input type="file" accept="image/*" onChange={(e) => onFileAppend(e, 'category')} />
          </label>
          <button type="submit">{categoryForm.id ? 'Update category' : 'Create category'}</button>
        </form>

        <div className="admin-list">
          {categories.map((category) => (
            <article key={category.id} className="admin-list-item">
              <div>
                <strong>{category.name}</strong>
                <span>{category.product_count} products</span>
              </div>
              <div className="row-actions">
                <button type="button" onClick={() => onEditCategory(category)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => onDeleteCategory(category.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </article>

      {/* Products */}
      <article className="admin-card">
        <h2>Products</h2>
        <form className="admin-form" onSubmit={onSubmitProduct}>
          <label>
            Name
            <input
              value={productForm.name}
              onChange={(e) => onProductFormChange({ name: e.target.value })}
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
                  categoryIds: Array.from(e.target.selectedOptions, (o) => o.value),
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
            />
          </label>
          <label className="upload-field">
            Upload image
            <input type="file" accept="image/*" onChange={(e) => onFileAppend(e, 'product')} />
          </label>
          <button type="submit">{productForm.id ? 'Update product' : 'Create product'}</button>
        </form>

        <div className="admin-list">
          {products.map((product) => (
            <article key={product.id} className="admin-list-item">
              <div>
                <strong>{product.name}</strong>
                <span>
                  {formatMoney(product.price)} · {product.categories.join(', ') || 'Unassigned'}
                </span>
              </div>
              <div className="row-actions">
                <button type="button" onClick={() => onEditProduct(product)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => onDeleteProduct(product.id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </article>
    </section>
  );
}
