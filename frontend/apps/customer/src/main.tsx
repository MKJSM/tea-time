import React from 'react';
import ReactDOM from 'react-dom/client';
import { ShellCard } from '@tea-time/ui';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ShellCard
      eyebrow="Customer App"
      title="Tea Time"
      description="Customer storefront workspace app."
    />
  </React.StrictMode>,
);

