import React from 'react';
import ReactDOM from 'react-dom/client';

import { ErrorBoundary } from '@tea-time/ui';

import { AdminApp } from './AdminApp';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AdminApp />
    </ErrorBoundary>
  </React.StrictMode>,
);
