
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
// Fix: Import from the store directory to get the Redux store instead of clashing with store.ts
import { store } from './store/index';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);
