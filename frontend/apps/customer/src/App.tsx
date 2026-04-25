import { HomePage } from './HomePage';
import { ProductsPage } from './ProductsPage';

export function App() {
  if (
    typeof window !== 'undefined' &&
    (window.location.pathname === '/products' || window.location.pathname === '/products/')
  ) {
    return <ProductsPage />;
  }

  return <HomePage />;
}
