import React, { useEffect, useState } from 'react';

import {
  getAdminHealth,
  getCategories,
  getCurrentAdmin,
  getProducts,
  loginAdmin,
  logoutAdmin,
} from '@tea-time/api-client';
import type {
  AdminAuthResponse,
  CategoryListItem,
  HealthResponse,
  LoginInput,
  ProductListItem,
} from '@tea-time/types';

const defaultLogin: LoginInput = {
  email: 'admin@tea-time.local',
  password: 'TeaTimeAdmin123!',
};

export function AdminApp() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [session, setSession] = useState<AdminAuthResponse | null>(null);
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [loginForm, setLoginForm] = useState<LoginInput>(defaultLogin);
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [healthResponse, categoryResponse, productResponse] = await Promise.all([
          getAdminHealth(),
          getCategories('admin'),
          getProducts('admin'),
        ]);

        if (cancelled) {
          return;
        }

        setHealth(healthResponse);
        setCategories(categoryResponse.items);
        setProducts(productResponse.items);
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : 'Failed to load admin data');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    async function restoreSession() {
      try {
        const response = await getCurrentAdmin();
        if (!cancelled) {
          setSession(response);
        }
      } catch {
        if (!cancelled) {
          setSession(null);
        }
      }
    }

    load();
    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    try {
      const response = await loginAdmin(loginForm);
      setSession(response);
      setMessage(`Logged in as ${response.admin.email}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Admin login failed');
    }
  }

  async function handleLogout() {
    try {
      await logoutAdmin();
      setSession(null);
      setMessage('Admin session closed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Admin logout failed');
    }
  }

  return (
    <main className="admin-shell">
      <section className="admin-hero">
        <div>
          <p className="admin-eyebrow">Tea Time Admin</p>
          <h1>Catalog and session checks against the live backend.</h1>
          <p className="admin-copy">
            This app is served by the same Rust backend under <code>/admin</code>, using the
            default admin bootstrap created at startup.
          </p>
        </div>
        <div className="admin-status-card">
          <strong>{health?.ok ? 'Admin API online' : 'Waiting for backend'}</strong>
          <span>{health?.database ? 'Database ready' : 'Database state unknown'}</span>
          <span>{session ? session.admin.email : 'Not logged in yet'}</span>
        </div>
      </section>

      <section className="admin-grid">
        <form className="admin-card" onSubmit={handleSubmit}>
          <h2>Admin login</h2>
          <label>
            Email
            <input
              type="email"
              value={loginForm.email}
              onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
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
          <button type="submit">Login</button>
          {session ? (
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          ) : null}
          <p className="admin-note">Default credentials are prefilled from backend defaults.</p>
          {message ? <p className="admin-message">{message}</p> : null}
        </form>

        <section className="admin-card">
          <h2>Categories</h2>
          {loading ? <p className="admin-note">Loading categories...</p> : null}
          <div className="admin-list">
            {categories.map((category) => (
              <article key={category.id} className="admin-list-item">
                <strong>{category.name}</strong>
                <span>{category.product_count} products</span>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-card admin-card-wide">
          <h2>Products</h2>
          {loading ? <p className="admin-note">Loading products...</p> : null}
          <div className="product-table">
            {products.map((product) => (
              <article key={product.id} className="product-row">
                <div>
                  <strong>{product.name}</strong>
                  <p>{product.description ?? 'No description'}</p>
                </div>
                <span>{product.categories.join(', ') || 'Unassigned'}</span>
                <span>₹{product.price.toFixed(0)}</span>
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
