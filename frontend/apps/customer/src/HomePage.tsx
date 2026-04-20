import React, { useEffect, useState } from 'react';

import {
  addCartItem,
  checkout,
  createAddress,
  deleteAddress,
  deleteCartItem,
  getAddresses,
  getBanners,
  getCart,
  getCategories,
  getCurrentCustomer,
  getCustomerHealth,
  getOrder,
  getOrders,
  getProducts,
  initiateRazorpayOrder,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  updateAddress,
  updateCartItem,
  updateCurrentCustomer,
  uploadFile,
  verifyPayment,
} from '@tea-time/api-client';
import type {
  Address,
  AddressInput,
  Banner,
  CartResponse,
  CategoryListItem,
  CheckoutResult,
  CustomerAuthResponse,
  CustomerRegisterInput,
  HealthResponse,
  LoginInput,
  OrderDetail,
  OrderSummary,
  ProductListItem,
} from '@tea-time/types';

import { AccountSection } from './components/AccountSection';
import { CartSection } from './components/CartSection';
import { CatalogSection } from './components/CatalogSection';
import { HeroSlider } from './components/HeroSlider';
import {
  CategoriesSection,
  WhySection,
  HowWeBrew,
  WhoWeServe,
  AboutSection,
  CTABand,
} from './components/MarketingContent';
import { OrdersSection } from './components/OrdersSection';
import { ensureRazorpayScript } from './lib/razorpay';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

type AsyncState = 'idle' | 'loading' | 'ready' | 'error';

const emptyRegisterForm: CustomerRegisterInput = {
  user_name: '',
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  password: '',
};

const emptyLoginForm: LoginInput = { email: '', password: '' };

const emptyAddressForm: AddressInput = {
  full_name: '',
  phone: '',
  line_1: '',
  line_2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
  landmark: '',
  is_default: true,
};

const fallbackBanners: Banner[] = [
  {
    id: 'fallback-1',
    title: 'Tea service designed for daily rhythm.',
    subtitle: 'Landing banner',
    description:
      'Full-width banner storytelling, category-led shopping, and a cleaner path from browse to order.',
    primary_button_label: 'Explore menu',
    primary_button_href: '#catalog',
    secondary_button_label: 'View cart',
    secondary_button_href: '#cart',
    media_url: null,
    media_kind: 'image',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #375c36 0%, #7d8f49 42%, #283b24 100%)',
    overlay_color: 'rgba(17, 24, 18, 0.28)',
    text_color: '#ffffff',
    sort_order: 1,
    is_active: true,
  },
];

const customerFlowAnchors = [
  { id: 'catalog', label: 'Browse menu' },
  { id: 'account', label: 'Sign in or register' },
  { id: 'cart', label: 'Review cart' },
  { id: 'orders', label: 'Track orders' },
] as const;

function normalizeAddressForm(address?: Address): AddressInput {
  if (!address) return emptyAddressForm;
  return {
    full_name: address.full_name,
    phone: address.phone,
    line_1: address.line_1,
    line_2: address.line_2 ?? '',
    city: address.city,
    state: address.state,
    postal_code: address.postal_code,
    country: address.country,
    landmark: address.landmark ?? '',
    is_default: address.is_default,
  };
}

export function HomePage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [_banners, setBanners] = useState<Banner[]>(fallbackBanners);
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [catalogState, setCatalogState] = useState<AsyncState>('loading');
  const [catalogMessage, setCatalogMessage] = useState<string>('');

  const [session, setSession] = useState<CustomerAuthResponse | null>(null);
  const [authState, setAuthState] = useState<AsyncState>('idle');
  const [authMessage, setAuthMessage] = useState<string>('');
  const [registerForm, setRegisterForm] = useState<CustomerRegisterInput>(emptyRegisterForm);
  const [loginForm, setLoginForm] = useState<LoginInput>(emptyLoginForm);
  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    avatar_url: '',
  });

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressForm, setAddressForm] = useState<AddressInput>(emptyAddressForm);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressState, setAddressState] = useState<AsyncState>('idle');
  const [addressMessage, setAddressMessage] = useState<string>('');

  const [cart, setCart] = useState<CartResponse | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<CheckoutResult | null>(null);
  const [orderMessage, setOrderMessage] = useState<string>('');
  const [paymentMessage, setPaymentMessage] = useState<string>('');
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const orderFulfilled = selectedOrder?.payment_status === 'paid';
  const checkoutReady = Boolean(
    session && addresses.find((a) => a.is_default) && cart?.items.length,
  );

  // Filter by category_ids or fall back to name match
  const filteredProducts =
    selectedCategoryId === 'all'
      ? products
      : products.filter(
          (p) =>
            p.category_ids.includes(selectedCategoryId) ||
            p.categories.some((c) => c.toLowerCase() === selectedCategoryId.toLowerCase()),
        );

  useEffect(() => {
    void loadPublicData();
    void restoreSession();
  }, []);

  // Auto-advance hero slider
  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((c) => (c + 1) % 3);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  // Intersection observer for fade-up animations
  useEffect(() => {
    const id = window.setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add('in-view');
          });
        },
        { threshold: 0.08 },
      );
      document.querySelectorAll('.fade-up').forEach((el) => observer.observe(el));
      (window as unknown as Record<string, unknown>)['__fadeObserver'] = observer;
    }, 0);
    return () => {
      window.clearTimeout(id);
      (
        (window as unknown as Record<string, unknown>)['__fadeObserver'] as
          | IntersectionObserver
          | undefined
      )?.disconnect();
    };
  }, []);

  async function loadPublicData(categoryId?: string) {
    setCatalogState('loading');
    setCatalogMessage('');
    try {
      const [healthRes, bannerRes, catRes, prodRes] = await Promise.all([
        getCustomerHealth(),
        getBanners(),
        getCategories(),
        getProducts('customer', categoryId),
      ]);
      setHealth(healthRes);
      setBanners(bannerRes.items.length ? bannerRes.items : fallbackBanners);
      setCategories(catRes.items);
      setProducts(prodRes.items);
      setCatalogState('ready');
    } catch (error) {
      setCatalogState('error');
      setCatalogMessage(error instanceof Error ? error.message : 'Failed to load landing page');
    }
  }

  async function loadPrivateData() {
    try {
      const [addrRes, cartRes, orderRes] = await Promise.all([
        getAddresses(),
        getCart(),
        getOrders(),
      ]);
      setAddresses(addrRes.items);
      setCart(cartRes);
      setOrders(orderRes.items);
    } catch (error) {
      setOrderMessage(error instanceof Error ? error.message : 'Failed to load account data');
    }
  }

  async function restoreSession() {
    try {
      const customer = await getCurrentCustomer();
      setSession(customer);
      setProfileForm({
        first_name: customer.user.first_name,
        last_name: customer.user.last_name,
        phone: customer.user.phone ?? '',
        avatar_url: customer.user.avatar_url ?? '',
      });
      await loadPrivateData();
    } catch {
      setSession(null);
    }
  }

  async function handleCategorySelect(categoryId: string) {
    setSelectedCategoryId(categoryId);
    try {
      const response = await getProducts(
        'customer',
        categoryId === 'all' ? undefined : categoryId,
      );
      setProducts(response.items);
    } catch (error) {
      setCatalogMessage(error instanceof Error ? error.message : 'Failed to filter products');
    }
  }

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthState('loading');
    setAuthMessage('');
    try {
      const response = await registerCustomer({
        ...registerForm,
        phone: registerForm.phone?.trim() || undefined,
      });
      setSession(response);
      setProfileForm({
        first_name: response.user.first_name,
        last_name: response.user.last_name,
        phone: response.user.phone ?? '',
        avatar_url: response.user.avatar_url ?? '',
      });
      setRegisterForm(emptyRegisterForm);
      setAuthState('ready');
      setAuthMessage(`Signed in as ${response.user.first_name}.`);
      await loadPrivateData();
    } catch (error) {
      setAuthState('error');
      setAuthMessage(error instanceof Error ? error.message : 'Registration failed');
    }
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthState('loading');
    setAuthMessage('');
    try {
      const response = await loginCustomer(loginForm);
      setSession(response);
      setProfileForm({
        first_name: response.user.first_name,
        last_name: response.user.last_name,
        phone: response.user.phone ?? '',
        avatar_url: response.user.avatar_url ?? '',
      });
      setLoginForm(emptyLoginForm);
      setAuthState('ready');
      setAuthMessage(`Welcome back, ${response.user.first_name}.`);
      await loadPrivateData();
    } catch (error) {
      setAuthState('error');
      setAuthMessage(error instanceof Error ? error.message : 'Login failed');
    }
  }

  async function handleLogout() {
    try {
      await logoutCustomer();
      setSession(null);
      setAddresses([]);
      setCart(null);
      setOrders([]);
      setSelectedOrder(null);
      setCheckoutResult(null);
      setPaymentMessage('');
      setOrderMessage('Customer session closed.');
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Logout failed');
    }
  }

  async function handleProfileSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await updateCurrentCustomer({
        first_name: profileForm.first_name,
        last_name: profileForm.last_name,
        phone: profileForm.phone || null,
        avatar_url: profileForm.avatar_url || null,
      });
      setSession(response);
      setAuthMessage('Profile updated.');
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Failed to update profile');
    }
  }

  async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const response = await uploadFile(file);
      setProfileForm((c) => ({ ...c, avatar_url: response.file_url }));
      setAuthMessage('Avatar uploaded. Save profile to apply it.');
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : 'Avatar upload failed');
    }
  }

  async function handleAddressSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAddressState('loading');
    setAddressMessage('');
    try {
      if (editingAddressId) {
        await updateAddress(editingAddressId, {
          ...addressForm,
          line_2: addressForm.line_2 || null,
          landmark: addressForm.landmark || null,
          country: addressForm.country || 'India',
        });
        setAddressMessage('Address updated.');
      } else {
        await createAddress({
          ...addressForm,
          line_2: addressForm.line_2 || null,
          landmark: addressForm.landmark || null,
          country: addressForm.country || 'India',
        });
        setAddressMessage('Address created.');
      }
      setAddressForm(emptyAddressForm);
      setEditingAddressId(null);
      setAddressState('ready');
      await loadPrivateData();
    } catch (error) {
      setAddressState('error');
      setAddressMessage(error instanceof Error ? error.message : 'Address save failed');
    }
  }

  async function handleAddressDelete(addressId: string) {
    try {
      await deleteAddress(addressId);
      await loadPrivateData();
      setAddressMessage('Address removed.');
    } catch (error) {
      setAddressMessage(error instanceof Error ? error.message : 'Failed to delete address');
    }
  }

  function startAddressEdit(address: Address) {
    setEditingAddressId(address.id);
    setAddressForm(normalizeAddressForm(address));
  }

  async function handleAddToCart(productId: string) {
    if (!session) {
      setOrderMessage('Please sign in before adding products to the cart.');
      window.location.hash = '#account';
      return;
    }
    setBusyProductId(productId);
    try {
      const response = await addCartItem({ product_id: productId, quantity: 1 });
      setCart(response);
      setOrderMessage('Product added to cart.');
    } catch (error) {
      setOrderMessage(error instanceof Error ? error.message : 'Failed to add product');
    } finally {
      setBusyProductId(null);
    }
  }

  async function handleCartQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      await handleCartDelete(itemId);
      return;
    }
    try {
      const response = await updateCartItem(itemId, quantity);
      setCart(response);
    } catch (error) {
      setOrderMessage(error instanceof Error ? error.message : 'Failed to update cart');
    }
  }

  async function handleCartDelete(itemId: string) {
    try {
      const response = await deleteCartItem(itemId);
      setCart(response);
    } catch (error) {
      setOrderMessage(error instanceof Error ? error.message : 'Failed to remove item');
    }
  }

  async function handleCheckout() {
    if (!cart?.items.length) {
      setOrderMessage('Your cart is empty. Add products before checking out.');
      return;
    }
    if (!addresses.length) {
      setOrderMessage('Create at least one delivery address before checkout.');
      return;
    }
    try {
      const selectedAddress = addresses.find((a) => a.is_default) ?? addresses[0]!;
      const result = await checkout({ address_id: selectedAddress.id });
      setCheckoutResult(result);
      setOrderMessage(`Order ${result.order_number} created. Continue to payment.`);
      const orderDetail = await getOrder(result.order_id);
      setSelectedOrder(orderDetail);
      await loadPrivateData();
    } catch (error) {
      setOrderMessage(error instanceof Error ? error.message : 'Checkout failed');
    }
  }

  async function handleOrderOpen(orderId: string) {
    try {
      const detail = await getOrder(orderId);
      setSelectedOrder(detail);
    } catch (error) {
      setOrderMessage(error instanceof Error ? error.message : 'Failed to load order');
    }
  }

  async function handlePaymentLaunch() {
    if (!checkoutResult) {
      setPaymentMessage('Create an order before starting payment.');
      return;
    }
    if (selectedOrder?.payment_status === 'paid') {
      setPaymentMessage('This order has already been paid.');
      return;
    }
    try {
      const payment = await initiateRazorpayOrder(checkoutResult.order_id);
      await ensureRazorpayScript();

      if (!window.Razorpay) {
        throw new Error('Razorpay checkout is unavailable');
      }

      const instance = new window.Razorpay({
        key: payment.razorpay_key_id,
        amount: payment.amount,
        currency: payment.currency,
        name: 'Tea Time',
        description: `Payment for ${payment.order_number}`,
        order_id: payment.provider_order_id,
        handler: async (response: Record<string, unknown>) => {
          await verifyPayment({
            provider_order_id: String(response.razorpay_order_id ?? ''),
            provider_payment_id: String(response.razorpay_payment_id ?? ''),
            provider_signature: String(response.razorpay_signature ?? ''),
          });
          setPaymentMessage('Payment verified successfully.');
          await loadPrivateData();
          const detail = await getOrder(checkoutResult.order_id);
          setSelectedOrder(detail);
        },
        prefill: session
          ? {
              name: `${session.user.first_name} ${session.user.last_name}`,
              email: session.user.email,
              contact: session.user.phone ?? undefined,
            }
          : undefined,
        theme: { color: '#315f40' },
      });

      instance.open();
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : 'Payment initiation failed');
    }
  }

  return (
    <main className="landing-page" id="home">
      {/* Header */}
      <header className="site-header">
        <div className="container header-row">
          <a className="brand" href="#home" style={{ textDecoration: 'none' }}>
            <img src="/assets/logo.webp" alt="Mobilitea Logo" className="logo" />
          </a>
          <nav className="site-nav">
            <a href="#home">Home</a>
            <a href="#about">About</a>
            <a href="#categories">Menu</a>
            <a href="#shop">Shop</a>
            <a href="#contact">Contact</a>
            <a href="#events">Events</a>
            <a href="#blog">Blog</a>
          </nav>
          <div className="header-actions">
            <span className="status-pill">{health?.ok ? '🟢 API online' : '⏳ Loading'}</span>
            {session ? (
              <button
                className="outline-button"
                type="button"
                onClick={() => void handleLogout()}
              >
                Logout
              </button>
            ) : (
              <a className="solid-button" href="#account">
                Sign in
              </a>
            )}
          </div>
        </div>
      </header>

      <HeroSlider activeSlide={activeSlide} onSlideChange={setActiveSlide} />

      <CategoriesSection />

      <CatalogSection
        categories={categories}
        products={filteredProducts}
        selectedCategoryId={selectedCategoryId}
        catalogState={catalogState}
        catalogMessage={catalogMessage}
        busyProductId={busyProductId}
        onCategorySelect={(id) => void handleCategorySelect(id)}
        onAddToCart={(id) => void handleAddToCart(id)}
      />

      <WhySection />
      <HowWeBrew />
      <WhoWeServe />
      <AboutSection />
      <CTABand />


      {/* Footer */}
      <footer className="site-footer fade-up">
        <div className="container">
          {/* CTA Strip */}
          <div className="footer-cta-strip">
            <div className="cta-text">
              <h2 className="serif">Ready to Energize Your Workplace?</h2>
              <p>Start your subscription today. Free 3-day trial.</p>
            </div>
            <a className="solid-button" href="#menu">
              Get Started Free →
            </a>
          </div>

          <div className="footer-grid">
            <article className="footer-col brand-col">
              <img src="/assets/logo.webp" alt="Mobilitea Logo" className="logo" />
              <p className="brand-desc">
                India's complete workplace refreshment ecosystem. Freshly brewed. Always on time.
              </p>
              <div className="tagline-text">SIP. ENERGIZE. REPEAT.</div>
            </article>

            <article className="footer-col">
              <span className="col-label">Company</span>
              <ul>
                <li>About Us</li>
                <li>Careers</li>
                <li>Blog</li>
                <li>Events</li>
                <li>Press</li>
                <li>Testimonials</li>
              </ul>
            </article>

            <article className="footer-col">
              <span className="col-label">Services</span>
              <ul>
                <li>Daily Subscription</li>
                <li>Bulk Orders</li>
                <li>Corporate Plans</li>
                <li>Event Catering</li>
                <li>App Download</li>
                <li>Flask Fleet</li>
              </ul>
            </article>

            <article className="footer-col">
              <span className="col-label">Support</span>
              <ul>
                <li>Help & Support</li>
                <li>Privacy Policy</li>
                <li>Terms & Conditions</li>
                <li>Feedback</li>
                <li>Contact Us</li>
              </ul>
            </article>
          </div>

          <div className="footer-bottom">
            <div className="container bottom-inner">
              <span className="copyright">© 2024 MOBILITEA. All rights reserved.</span>
              <div className="bottom-links">
                <span>Privacy</span>
                <span>Terms</span>
                <span>Cookies</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
