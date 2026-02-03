import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/layout/Navbar';
import MobileBottomNav from './components/layout/MobileBottomNav';
import Footer from './components/layout/Footer';
import LoadingSpinner from './components/common/LoadingSpinner';
import ScrollToTop from './components/common/ScrollToTop';
import { useAppDispatch } from './store/hooks';
import { loadCartFromStorage, fetchCartFromBackend } from './features/cart/cartSlice';
import { fetchCurrentUser } from './features/auth/authSlice';
import { initCartDB, migrateCartFromLocalStorage } from './utils/indexedDB';

// Lazy load core pages
const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetailsPage = lazy(() => import('./pages/OrderDetailsPage'));
const OrderTrackingPage = lazy(() => import('./pages/OrderTrackingPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const WhoWeServePage = lazy(() => import('./pages/WhoWeServePage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));

// Lazy load non-critical components (modals, drawers)
const AuthModal = lazy(() => import('./components/auth/AuthModal'));
const GlobalAddressModal = lazy(() => import('./components/address/GlobalAddressModal'));
const CartDrawer = lazy(() => import('./components/layout/CartDrawer').then(m => ({ default: m.CartDrawer })));
const QuickCartNotification = lazy(() => import('./components/layout/QuickCartNotification').then(m => ({ default: m.QuickCartNotification })));

// Simple page wrapper without heavy animations for better performance
const PageWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="pb-24 lg:pb-0 min-h-[60vh] animate-fadeIn">
      {children}
    </div>
  );
};

const App: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize IndexedDB and load cart on app startup
    const initializeApp = async () => {
      try {
        // Initialize IndexedDB
        await initCartDB();

        // Migrate from localStorage if needed (one-time operation)
        await migrateCartFromLocalStorage();

        // Verify session / fetch user profile first
        const result = await dispatch(fetchCurrentUser());

        // If user is authenticated, fetch cart from backend
        // Otherwise, load from IndexedDB (guest cart)
        if (fetchCurrentUser.fulfilled.match(result)) {
          dispatch(fetchCartFromBackend());
        } else {
          dispatch(loadCartFromStorage());
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Fall back to loading local cart on error
        dispatch(loadCartFromStorage());
      }
    };

    initializeApp();
  }, [dispatch]);

  return (
    <Router>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen font-sans bg-cream relative">
        {/* Skip link for keyboard navigation */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Navbar />
        <main id="main-content" className="flex-grow pt-16" role="main">
          <Suspense fallback={<LoadingSpinner fullPage />}>
            <Routes>
              <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
              <Route path="/shop" element={<PageWrapper><ProductsPage /></PageWrapper>} />
              <Route path="/product/:id" element={<PageWrapper><ProductDetailPage /></PageWrapper>} />
              <Route path="/cart" element={<PageWrapper><CartPage /></PageWrapper>} />
              <Route path="/checkout" element={<PageWrapper><CheckoutPage /></PageWrapper>} />
              <Route path="/profile" element={<PageWrapper><ProfilePage /></PageWrapper>} />
              <Route path="/orders" element={<PageWrapper><OrdersPage /></PageWrapper>} />
              <Route path="/order/:id" element={<PageWrapper><OrderDetailsPage /></PageWrapper>} />
              <Route path="/tracking/:id" element={<PageWrapper><OrderTrackingPage /></PageWrapper>} />
              <Route path="/about" element={<PageWrapper><AboutPage /></PageWrapper>} />
              <Route path="/who-we-serve" element={<PageWrapper><WhoWeServePage /></PageWrapper>} />
              <Route path="/support" element={<PageWrapper><SupportPage /></PageWrapper>} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <MobileBottomNav />

        {/* Lazy loaded modals and drawers */}
        <Suspense fallback={null}>
          <AuthModal />
          <GlobalAddressModal />
          <CartDrawer />
          <QuickCartNotification />
        </Suspense>

        <Toaster position="bottom-center" />
      </div>
    </Router>
  );
};

export default App;
