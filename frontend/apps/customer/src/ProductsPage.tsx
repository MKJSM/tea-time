import React, { useEffect, useState } from 'react';

import { getCategories, getProducts } from '@tea-time/api-client';
import type { CategoryListItem, ProductListItem } from '@tea-time/types';

import { CatalogSection } from './components/CatalogSection';
import { readCategorySlug } from './lib/catalog';
import { useSiteTheme } from './lib/theme';

type AsyncState = 'idle' | 'loading' | 'ready' | 'error';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

export function ProductsPage() {
  const { theme, toggleTheme } = useSiteTheme();
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [catalogState, setCatalogState] = useState<AsyncState>('loading');
  const [catalogMessage, setCatalogMessage] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [requestedCategorySlug, setRequestedCategorySlug] = useState(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    return readCategorySlug(window.location.search);
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncFromLocation = () => {
      setRequestedCategorySlug(readCategorySlug(window.location.search));
    };

    window.addEventListener('popstate', syncFromLocation);
    return () => window.removeEventListener('popstate', syncFromLocation);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setCatalogState('loading');
      setCatalogMessage('');

      try {
        const categoryResult = await getCategories();
        if (cancelled) return;

        const nextCategories = categoryResult.items;
        const resolvedCategory = requestedCategorySlug
          ? nextCategories.find((category) => category.slug === requestedCategorySlug)
          : null;

        setCategories(nextCategories);
        setSelectedCategoryId(resolvedCategory?.id ?? 'all');

        if (requestedCategorySlug && !resolvedCategory) {
          setCatalogMessage(`Category "${requestedCategorySlug}" was not found. Showing all products.`);
        }

        const productResult = await getProducts('customer', resolvedCategory?.id);
        if (cancelled) return;

        setProducts(productResult.items);
        setCatalogState('ready');
      } catch (error) {
        if (cancelled) return;
        setCategories([]);
        setProducts([]);
        setCatalogState('error');
        setCatalogMessage(getErrorMessage(error));
      }
    }

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, [requestedCategorySlug]);

  function updateCategoryQuery(categorySlug: string | null) {
    if (typeof window === 'undefined') return;

    const nextUrl = new URL(window.location.href);
    if (categorySlug) {
      nextUrl.searchParams.set('category', categorySlug);
    } else {
      nextUrl.searchParams.delete('category');
    }

    window.history.pushState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
    setRequestedCategorySlug(categorySlug);
  }

  function handleCategorySelect(categoryId: string) {
    if (categoryId === 'all') {
      updateCategoryQuery(null);
      return;
    }

    const category = categories.find((item) => item.id === categoryId);
    if (!category) return;
    updateCategoryQuery(category.slug);
  }

  return (
    <main className="landing-page products-page" id="products">
      <header className="site-header">
        <div className="container header-row">
          <a className="brand" href="/" style={{ textDecoration: 'none' }}>
            <img src="/assets/logo.webp" alt="Mobilitea Logo" className="logo" />
          </a>
          <nav className="site-nav products-nav">
            <a href="/">Home</a>
            <a href="/#categories">Categories</a>
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
            <a className="solid-button" href="/">
              Back Home
            </a>
          </div>
        </div>
      </header>

      <section className="products-hero">
        <div className="container products-hero-inner">
          <span className="eyebrow">Products</span>
          <h1>Browse the full menu by category.</h1>
          <p>
            Pick a category chip to keep the address bar in sync and jump directly to the
            products you want to explore.
          </p>
        </div>
      </section>

      <CatalogSection
        categories={categories}
        products={products}
        selectedCategoryId={selectedCategoryId}
        catalogState={catalogState}
        catalogMessage={catalogMessage}
        onCategorySelect={handleCategorySelect}
      />
    </main>
  );
}
