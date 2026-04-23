import { useState, type FormEvent } from 'react';

import { loginAdmin } from '@tea-time/api-client';
import type { AdminAuthResponse, LoginInput } from '@tea-time/types';

interface Props {
  onLoginSuccess: (session: AdminAuthResponse) => void | Promise<void>;
  checkingSession?: boolean;
}

const emptyLogin: LoginInput = { email: '', password: '' };

export function LoginPage({ onLoginSuccess, checkingSession = false }: Props) {
  const [form, setForm] = useState<LoginInput>(emptyLogin);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const session = await loginAdmin(form);
      await onLoginSuccess(session);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Admin login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <p className="admin-eyebrow">Tea Time Admin</p>
        <h1>Sign in to the dashboard</h1>
        <p className="login-copy">
          Use the admin credentials configured on the server to manage categories, products,
          banners, orders, and payments.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
            />
          </label>

          <button type="submit" disabled={submitting || checkingSession}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {checkingSession ? <p className="login-status">Checking existing session…</p> : null}
        {error ? <p className="login-error">{error}</p> : null}
      </section>
    </main>
  );
}
