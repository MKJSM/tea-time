import type { AdminAuthResponse, DashboardSummary, HealthResponse, LoginInput } from '@tea-time/types';

interface Props {
  health: HealthResponse | null;
  summary: DashboardSummary | null;
  session: AdminAuthResponse | null;
  loginForm: LoginInput;
  message: string;
  onLoginFormChange: (patch: Partial<LoginInput>) => void;
  onLogin: (event: React.FormEvent<HTMLFormElement>) => void;
  onLogout: () => void;
}

export function OverviewSection({
  health,
  summary,
  session,
  loginForm,
  message,
  onLoginFormChange,
  onLogin,
  onLogout,
}: Props) {
  return (
    <section className="admin-summary-grid" id="admin-overview">
      <article className="admin-card admin-login-card">
        <h2>Admin session</h2>
        {session ? (
          <>
            <strong>{session.admin.email}</strong>
            <p className="admin-copy">
              Use the panels below to keep the customer and admin flows fully populated.
            </p>
            <button type="button" onClick={onLogout}>
              Logout
            </button>
          </>
        ) : (
          <form className="admin-form" onSubmit={onLogin}>
            <label>
              Email
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => onLoginFormChange({ email: e.target.value })}
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => onLoginFormChange({ password: e.target.value })}
              />
            </label>
            <button type="submit">Login</button>
          </form>
        )}
        {message ? <p className="admin-message">{message}</p> : null}
      </article>

      <article className="admin-card metric-card">
        <span>Backend</span>
        <strong>{health?.database ? 'Database ready' : 'Checking…'}</strong>
      </article>

      {summary
        ? (
            [
              ['Products', summary.products],
              ['Categories', summary.categories],
              ['Users', summary.users],
              ['Orders', summary.orders],
              ['Paid payments', summary.paid_payments],
            ] as [string, number][]
          ).map(([label, value]) => (
            <article key={label} className="admin-card metric-card">
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))
        : null}
    </section>
  );
}
