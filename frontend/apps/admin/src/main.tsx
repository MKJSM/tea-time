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
      eyebrow="Admin App"
      title="Tea Time Admin"
      description="Admin workspace app served under /admin."
    />
  </React.StrictMode>,
);

