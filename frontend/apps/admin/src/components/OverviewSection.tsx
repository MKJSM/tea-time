import type { AdminAuthResponse, DashboardSummary, HealthResponse } from '@tea-time/types';

interface Props {
  health: HealthResponse | null;
  summary: DashboardSummary | null;
  session: AdminAuthResponse;
}

export function OverviewSection({ health, summary, session }: Props) {
  return (
    <section className="admin-page-section" id="admin-overview">
      <article className="admin-card overview-card">
        <div className="overview-head">
          <div>
            <p className="section-kicker">Signed in</p>
            <h2>{session.admin.email}</h2>
            <p className="section-copy">
              Use the sidebar to move between categories, products, banners, customers, orders,
              and payments.
            </p>
          </div>
          <div className="overview-meta">
            <span className="status-chip is-active">Session active</span>
            <span className="type-chip">{health?.database ? 'Database ready' : 'Checking database'}</span>
            <span className="mode-chip">Admin: {session.admin.user_name}</span>
          </div>
        </div>

        <div className="overview-summary-grid">
          <article className="overview-note">
            <span>Backend scope</span>
            <strong>{health?.scope ?? 'admin'}</strong>
            <p>{health?.service ?? 'Serving the authenticated admin dashboard.'}</p>
          </article>
          <article className="overview-note">
            <span>Database</span>
            <strong>{health?.database ? 'Connected' : 'Loading'}</strong>
            <p>
              {health?.database
                ? 'Live catalog, banners, and orders are available.'
                : 'Waiting for the latest health response.'}
            </p>
          </article>
        </div>

        <div className="overview-grid">
          {summary ? (
            (
              [
                ['Products', summary.products],
                ['Categories', summary.categories],
                ['Users', summary.users],
                ['Orders', summary.orders],
                ['Paid payments', summary.paid_payments],
              ] as [string, number][]
            ).map(([label, value]) => (
              <article key={label} className="overview-metric">
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))
          ) : (
            <article className="overview-metric overview-metric--wide">
              <span>Summary</span>
              <strong>Loading…</strong>
            </article>
          )}
        </div>
      </article>
    </section>
  );
}
