import React from 'react';
import ReactDOM from 'react-dom/client';

import { HomePage } from './HomePage';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <HomePage />
  </React.StrictMode>,
);
