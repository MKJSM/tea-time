export function buildProductsPath(categorySlug?: string | null) {
  if (!categorySlug) {
    return '/products';
  }

  const params = new URLSearchParams();
  params.set('category', categorySlug);
  return `/products?${params.toString()}`;
}

export function readCategorySlug(search: string) {
  const value = new URLSearchParams(search).get('category');
  const normalized = value?.trim().toLowerCase();
  return normalized ? normalized : null;
}
