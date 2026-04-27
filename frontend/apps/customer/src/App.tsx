import { HomePage } from './HomePage';
import { ProductDetailPage } from './ProductDetailPage';
import { ProductsPage } from './ProductsPage';

export function App() {
  if (
    typeof window !== 'undefined' &&
    window.location.pathname.startsWith('/product/')
  ) {
    return <ProductDetailPage />;
  }

  if (
    typeof window !== 'undefined' &&
    (window.location.pathname === '/products' || window.location.pathname === '/products/')
  ) {
    return <ProductsPage />;
  }

  return <HomePage />;
}
