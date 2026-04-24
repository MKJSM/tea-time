import type { CSSProperties } from 'react';

import type { AppCardData } from '@tea-time/types';

export { ErrorBoundary } from './ErrorBoundary';
export { BannerRenderer, sanitizeBannerHtml } from './bannerRenderer';

export function ShellCard({ eyebrow, title, description }: AppCardData) {
  return (
    <main style={styles.shell}>
      <section style={styles.card}>
        <p style={styles.eyebrow}>{eyebrow}</p>
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.description}>{description}</p>
      </section>
    </main>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: '24px',
    background: '#f5f1e8',
    color: '#1f2937',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  card: {
    width: 'min(100%, 640px)',
    padding: '32px',
    borderRadius: '20px',
    background: '#ffffff',
    boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)',
  },
  eyebrow: {
    margin: '0 0 8px',
    fontSize: '12px',
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: '#6b7280',
  },
  title: {
    margin: '0 0 12px',
    fontSize: '40px',
    lineHeight: 1.1,
  },
  description: {
    margin: 0,
    fontSize: '16px',
    lineHeight: 1.6,
  },
};
