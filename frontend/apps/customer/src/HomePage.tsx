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

const emptyLoginForm: LoginInput = {
  email: '',
  password: '',
};

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
  {
    id: 'fallback-2',
    title: 'Products and categories stay connected.',
    subtitle: 'Filterable catalog',
    description:
      'Customers can browse by category, add items to the cart, and move directly into address and payment flow.',
    primary_button_label: 'Browse products',
    primary_button_href: '#catalog',
    secondary_button_label: 'My orders',
    secondary_button_href: '#orders',
    media_url: null,
    media_kind: 'image',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #efe7df 0%, #d9dfd0 36%, #c7d7c5 100%)',
    overlay_color: 'rgba(255, 255, 255, 0.08)',
    text_color: '#17211b',
    sort_order: 2,
    is_active: true,
  },
  {
    id: 'fallback-3',
    title: 'Orders and payments stay visible after checkout.',
    subtitle: 'Customer flow',
    description:
      'Address selection, checkout creation, Razorpay initiation, and order tracking are available from one page.',
    primary_button_label: 'Start checkout',
    primary_button_href: '#cart',
    secondary_button_label: 'Manage account',
    secondary_button_href: '#account',
    media_url: null,
    media_kind: 'image',
    background_type: 'gradient',
    background_value: 'linear-gradient(135deg, #72285f 0%, #b25aac 46%, #d884b0 100%)',
    overlay_color: 'rgba(34, 10, 28, 0.16)',
    text_color: '#ffffff',
    sort_order: 3,
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
  if (!address) {
    return emptyAddressForm;
  }

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

function formatMoney(value: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function ensureRazorpayScript() {
  if (window.Razorpay) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay script')), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpay = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay script'));
    document.body.appendChild(script);
  });
}

function bannerStyle(banner: Banner): React.CSSProperties {
  if (banner.background_type === 'image' && banner.media_url) {
    return { backgroundImage: `url(${banner.media_url})` };
  }
  if (banner.background_type === 'video' && banner.media_url) {
    return { backgroundImage: `url(${banner.media_url})` };
  }
  if (banner.background_type === 'solid') {
    return { backgroundColor: banner.background_value ?? '#305a3e' };
  }
  return { backgroundImage: banner.background_value ?? fallbackBanners[0].background_value ?? undefined };
}

export function HomePage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [banners, setBanners] = useState<Banner[]>(fallbackBanners);
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

  const defaultAddress = addresses.find((address) => address.is_default) ?? null;
  const checkoutReady = Boolean(session && defaultAddress && cart?.items.length);
  const orderFulfilled = selectedOrder?.payment_status === 'paid';

  // Bug #12 fix: filter by category_ids array OR fall back to category name match
  const filteredProducts =
    selectedCategoryId === 'all'
      ? products
      : products.filter(
        (product) =>
          product.category_ids.includes(selectedCategoryId) ||
          product.categories.some(
            (c) => c.toLowerCase() === selectedCategoryId.toLowerCase(),
          ),
      );

  // Bug #8 fix: single mount effect — no double invocation
  useEffect(() => {
    void loadPublicData();
    void restoreSession();
  }, []);

  // Auto-advance hero slider
  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % 3);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  // Bug #9 fix: defer observer so DOM is painted before observing
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
      // store reference so cleanup works
      (window as any).__fadeObserver = observer;
    }, 0);
    return () => {
      window.clearTimeout(id);
      (window as any).__fadeObserver?.disconnect();
    };
  }, []);


  async function loadPublicData(categoryId?: string) {
    setCatalogState('loading');
    setCatalogMessage('');

    try {
      const [healthResponse, bannerResponse, categoryResponse, productResponse] = await Promise.all([
        getCustomerHealth(),
        getBanners(),
        getCategories(),
        getProducts('customer', categoryId),
      ]);

      setHealth(healthResponse);
      setBanners(bannerResponse.items.length ? bannerResponse.items : fallbackBanners);
      setCategories(categoryResponse.items);
      setProducts(productResponse.items);
      setCatalogState('ready');
    } catch (error) {
      setCatalogState('error');
      setCatalogMessage(error instanceof Error ? error.message : 'Failed to load landing page');
    }
  }

  async function loadPrivateData() {
    try {
      const [addressResponse, cartResponse, orderResponse] = await Promise.all([
        getAddresses(),
        getCart(),
        getOrders(),
      ]);
      setAddresses(addressResponse.items);
      setCart(cartResponse);
      setOrders(orderResponse.items);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load account data';
      setOrderMessage(message);
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
      const response = await getProducts('customer', categoryId === 'all' ? undefined : categoryId);
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
    if (!file) {
      return;
    }

    try {
      const response = await uploadFile(file);
      setProfileForm((current) => ({ ...current, avatar_url: response.file_url }));
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
      // Bug #14 fix: guide guest to sign in
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
    // Bug #6 fix: guard against empty cart
    if (!cart?.items.length) {
      setOrderMessage('Your cart is empty. Add products before checking out.');
      return;
    }
    if (!addresses.length) {
      setOrderMessage('Create at least one delivery address before checkout.');
      return;
    }

    try {
      const selectedAddress = addresses.find((address) => address.is_default) ?? addresses[0]!;
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
    // Bug #7 fix: guard against double payment
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
          const provider_order_id = String(response.razorpay_order_id ?? '');
          const provider_payment_id = String(response.razorpay_payment_id ?? '');
          const provider_signature = String(response.razorpay_signature ?? '');
          await verifyPayment({
            provider_order_id,
            provider_payment_id,
            provider_signature,
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
        theme: {
          color: '#315f40',
        },
      });

      instance.open();
    } catch (error) {
      setPaymentMessage(error instanceof Error ? error.message : 'Payment initiation failed');
    }
  }

  return (
    <main className="landing-page" id="home">
      {/* ── Header ── */}
      <header className="site-header">
        <div className="container header-row">
          <a className="brand" href="#home">
            <span className="brand-mark" aria-hidden="true" />
            <span>
              <span className="serif" style={{ fontSize: 22, lineHeight: 1 }}>Mobilitea</span>
              <small>Sip. Energize. Repeat.</small>
            </span>
          </a>
          <nav className="site-nav">
            <a href="#categories">Menu</a>
            <a href="#why">Why us</a>
            <a href="#ritual">Our process</a>
            <a href="#corporate">Who we serve</a>
          </nav>
          <div className="header-actions">
            <span className="status-pill">{health?.ok ? '🟢 API online' : '⏳ Loading'}</span>
            {session ? (
              <button className="outline-button" type="button" onClick={handleLogout}>Logout</button>
            ) : (
              <a className="solid-button" href="#account">Sign in</a>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Slider ── */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-slider">
            {/* Slide 1 — Tea delivery */}
            <article className={`hero-slide${activeSlide === 0 ? ' is-active' : ''}`} aria-hidden={activeSlide !== 0}>
              <div className="hero-slide-background" style={{ background: 'linear-gradient(180deg,rgba(0,0,0,.10),rgba(0,0,0,.26)),linear-gradient(135deg,#3d5a36,#7e8f45 44%,#2e4626)' }} />
              <div className="hero-overlay" style={{ background: 'linear-gradient(90deg,rgba(18,24,18,.62) 0%,rgba(18,24,18,.28) 38%,rgba(18,24,18,.08) 100%)' }} />
              <div className="hero-slide-content">
                <div className="hero-copy">
                  <span className="eyebrow">Daily Workplace Refreshment</span>
                  <h1>Refreshment That Moves with Your Workday.</h1>
                  <p>Daily delivery of hot &amp; cold beverages—tea, coffee, fresh juices—plus snacks, served at your workplace morning and evening, through a hassle-free subscription.</p>
                  <p>Because energized teams build better businesses.</p>
                  <div className="hero-actions-row">
                    <a className="solid-button" href="#account">Subscribe now</a>
                    <a className="ghost-button" href="#categories">Explore menu</a>
                  </div>
                  <div className="slide-badges">
                    <span className="slide-badge">Delivered in hygienic thermosteel flasks</span>
                    <span className="slide-badge">Freshly brewed using high-quality ingredients</span>
                    <span className="slide-badge">Crafted with love &amp; care</span>
                  </div>
                </div>
                <div className="hero-art">
                  <div className="tea-field" />
                  <div className="v2-wood" />
                  <div className="v2-cup" />
                  <div className="v2-steam" />
                  <div className="hero-card">
                    <h4>SIP. ENERGIZE. REPEAT.</h4>
                    <p>Reliable workplace refreshment, built around daily comfort and clean delivery.</p>
                  </div>
                </div>
              </div>
            </article>

            {/* Slide 2 — App */}
            <article className={`hero-slide${activeSlide === 1 ? ' is-active' : ''}`} aria-hidden={activeSlide !== 1}>
              <div className="hero-slide-background" style={{ background: 'radial-gradient(circle at 22% 14%,rgba(255,255,255,.14),transparent 18%),linear-gradient(135deg,#efe7df 0%,#dedfd8 36%,#cfdbc8 100%)' }} />
              <div className="hero-overlay" style={{ background: 'linear-gradient(90deg,rgba(18,24,18,.38) 0%,rgba(18,24,18,.12) 42%,rgba(18,24,18,.02) 100%)' }} />
              <div className="hero-slide-content">
                <div className="hero-copy">
                  <span className="eyebrow">Smart Ordering App</span>
                  <h1>One App. Endless Refreshment.</h1>
                  <p>With the MOBILITEA app, ordering your daily beverages and snacks is just a tap away—simple, reliable, and made for busy workdays.</p>
                  <div className="hero-actions-row">
                    <a className="solid-button" href="#account">Download the app</a>
                    <a className="ghost-button" href="#why">View features</a>
                  </div>
                  <div className="slide-badges">
                    <span className="slide-badge">Customized Flask Ordering</span>
                    <span className="slide-badge">Real-Time Order Tracking</span>
                    <span className="slide-badge">Go Paperless. Go Green.</span>
                  </div>
                </div>
                <div className="hero-art">
                  <div className="phone-mock">
                    <div className="phone-screen">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800 }}>Mobilitea <span>☕</span></div>
                      <div className="mock-card"><strong style={{ display: 'block', color: '#1f1f1f' }}>Morning order</strong>Tea flask · 10 cups · arriving in 12 min</div>
                      <div className="mock-card"><strong style={{ display: 'block', color: '#1f1f1f' }}>Live tracking</strong>Driver assigned · office route active</div>
                      <div className="mock-card"><strong style={{ display: 'block', color: '#1f1f1f' }}>Subscription</strong>Morning &amp; evening plan active</div>
                      <div className="mock-card"><strong style={{ display: 'block', color: '#1f1f1f' }}>Billing</strong>Paperless invoice generated</div>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* Slide 3 — Events */}
            <article className={`hero-slide${activeSlide === 2 ? ' is-active' : ''}`} aria-hidden={activeSlide !== 2}>
              <div className="hero-slide-background" style={{ background: 'radial-gradient(circle at 20% 20%,rgba(255,255,255,.20),transparent 16%),linear-gradient(135deg,#6f295e 0%,#b055ac 40%,#dd8dbd 100%)' }} />
              <div className="hero-overlay" style={{ background: 'linear-gradient(90deg,rgba(17,24,18,.32) 0%,rgba(17,24,18,.08) 42%,rgba(17,24,18,.04) 100%)' }} />
              <div className="hero-slide-content">
                <div className="hero-copy">
                  <span className="eyebrow">Bulk &amp; Event Orders</span>
                  <h1>Seamless Refreshment for Every Occasion.</h1>
                  <p>MOBILITEA undertakes bulk, corporate, and event orders, delivering tea, coffee, beverages, and snacks with consistency and care—no matter the scale.</p>
                  <div className="hero-actions-row">
                    <a className="solid-button" href="#account">Get your quote</a>
                    <a className="ghost-button" href="#corporate">Plan an event</a>
                  </div>
                </div>
                <div className="hero-art">
                  <div className="event-panel">
                    <h3>Perfect Tea for Your Special Events</h3>
                    <p>Bulk, corporate, and event refreshment with premium service and consistent delivery.</p>
                    <div className="hero-actions-row" style={{ marginTop: 0 }}>
                      <button className="solid-button" style={{ background: '#ffcf38', color: '#23180f' }}>Plan your event</button>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* Slide indicators */}
            <div className="slide-indicators">
              {[0, 1, 2].map((i) => (
                <button key={i} type="button" className={`hero-indicator${activeSlide === i ? ' is-active' : ''}`} onClick={() => setActiveSlide(i)} aria-label={`Slide ${i + 1}`} />
              ))}
            </div>
          </div>

          {/* Ticker */}
          <div className="ticker-wrap">
            <div className="ticker">
              <span className="ticker-item">☕ <b>Tech in every step</b> · taste in every sip</span>
              <span className="ticker-item">📍 Real-time delivery tracking</span>
              <span className="ticker-item">🧊 Temperature lock in insulated flasks</span>
              <span className="ticker-item">🏢 Built for offices, events, and institutions</span>
              <span className="ticker-item">☕ <b>Tech in every step</b> · taste in every sip</span>
              <span className="ticker-item">📍 Real-time delivery tracking</span>
              <span className="ticker-item">🧊 Temperature lock in insulated flasks</span>
              <span className="ticker-item">🏢 Built for offices, events, and institutions</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="section fade-up" id="categories">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Categories</span>
              <h2>Choose from every kind of workplace refreshment.</h2>
            </div>
            <p>Hot beverages, coolers, milkshakes, fresh juices, snacks, sandwiches, and desserts — delivered fresh every day.</p>
          </div>
          <div className="category-grid">
            {[
              { label: 'Hot Beverages', cls: '', art: <div className="v2-kettle" /> },
              { label: 'Coolers', cls: 'cooler', art: <div className="v2-glass" /> },
              { label: 'Milkshakes', cls: 'milkshake', art: <div className="v2-glass" style={{ left: 84 }} /> },
              { label: 'Fresh Juices', cls: 'juice', art: <div className="v2-glass juice" style={{ left: 84 }} /> },
              { label: 'Snacks', cls: 'snack', art: <div className="v2-biscuit-stack"><div className="v2-cookie one" /><div className="v2-cookie two" /><div className="v2-cookie three" /></div> },
              { label: 'Sandwiches', cls: 'sandwich', art: <div className="v2-cake-loaf sandwich" /> },
              { label: 'Desserts', cls: 'dessert', art: <div className="v2-cake-loaf" /> },
            ].map(({ label, cls, art }) => (
              <article key={label} className="card category-card">
                <div className={`category-media${cls ? ' ' + cls : ''}`}>{art}</div>
                <div className="category-body">
                  <h3>{label}</h3>
                  <p>Freshly prepared and ready for repeat ordering.</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Mobilitea ── */}
      <section className="section fade-up" id="why">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Why Mobilitea</span>
              <h2>Built for quality, freshness, and reliability.</h2>
            </div>
            <p>Our key value story — quality ingredients, strict hygiene, smart technology, and on-time delivery.</p>
          </div>
          <div className="feature-grid">
            {[
              { icon: '🌿', title: 'Quality You Can Taste', desc: 'Made with high-quality ingredients and hygienically prepared for pure taste you can trust.' },
              { icon: '🛡️', title: 'Strict Hygiene Standards', desc: 'Prepared, handled, and packed with utmost hygiene because safety matters every day.' },
              { icon: '🔥', title: 'Freshness First', desc: 'Freshly brewed beverages delivered hot every time with no reheating and no compromise.' },
              { icon: '📱', title: 'Smart Subscription Control', desc: 'Ordering, tracking, pause, resume, and preference control built to feel effortless.' },
              { icon: '⏱️', title: 'Right on Time', desc: 'Morning and evening deliveries you can count on so teams never miss a tea break.' },
            ].map(({ icon, title, desc }) => (
              <article key={title} className="card feature-card">
                <div className="v2-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
          <div className="cta-row"><a className="outline-button" href="#account">Subscribe now</a></div>
        </div>
      </section>

      {/* ── Process ── */}
      <section className="section fade-up" id="ritual">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">How we make the perfect cuppa ☕</span>
              <h2>The Mobilitea way, kept simple and consistent.</h2>
            </div>
            <p>A clean summary of our tea-making ritual, kept short so the page stays elegant and easy to scan.</p>
          </div>
          <div className="steps-grid">
            {[
              { n: '01', title: 'Start with Pure Water', desc: 'Great tea begins with fresh, clean purified water to preserve the true flavor of the leaves.' },
              { n: '02', title: 'Add Premium Tea Leaves', desc: 'Carefully measured high-quality leaves chosen for aroma, color, and balanced strength.' },
              { n: '03', title: 'Brew with Patience', desc: 'The tea is allowed to brew slowly so the leaves release full character and natural aroma.' },
              { n: '04', title: 'Serve Hot in Flask', desc: 'Immediately poured into thermosteel flasks to lock in heat, freshness, and flavor.' },
            ].map(({ n, title, desc }) => (
              <article key={n} className="card v2-step">
                <div className="step-num">{n}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who we serve ── */}
      <section className="section fade-up" id="corporate">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Who we serve</span>
              <h2>Built for workplaces, institutions, and events.</h2>
            </div>
            <p>From busy IT parks to celebratory occasions — we keep everyone refreshed.</p>
          </div>
          <div className="serve-grid">
            {[
              { icon: '🏢', title: 'Corporate Offices & IT Parks', desc: 'Daily tea, coffee, and refreshment solutions for teams of all sizes.' },
              { icon: '🏬', title: 'Retail, Showrooms & Shops', desc: 'Consistent beverage service to keep staff refreshed throughout the day.' },
              { icon: '🏥', title: 'Hospitals & Institutions', desc: 'Reliable hygienic beverage supply for healthcare and educational spaces.' },
              { icon: '🏭', title: 'Factories & Industrial Units', desc: 'Large-volume, on-time refreshment service for shift-based teams.' },
              { icon: '🧑‍💼', title: 'Co-working Spaces', desc: 'Flexible plans tailored to dynamic workplaces and shared business centers.' },
              { icon: '🎉', title: 'Meetings, Events & Gatherings', desc: 'Tea, coffee, juices, and snacks for conferences, launches, and celebrations.' },
            ].map(({ icon, title, desc }) => (
              <article key={title} className="card serve-card">
                <div className="v2-icon">{icon}</div>
                <h3>{title}</h3>
                <p>{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Band ── */}
      <section className="section fade-up">
        <div className="container">
          <div className="cta-band">
            <span className="eyebrow">Upgrade your workplace breaks</span>
            <h2>A refreshment system that feels premium, dependable, and easy to manage.</h2>
            <p>Daily subscriptions, event support, app-based ordering, paperless billing, and customized flask delivery — all in one.</p>
            <div className="cta-band-actions">
              <a className="solid-button" href="#account">Subscribe now</a>
              <button className="outline-button" type="button">Get corporate quote</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Customer journey rail ── */}
      <section className="container flow-rail" aria-label="Customer journey">
        {customerFlowAnchors.map((item, index) => {
          const isComplete =
            (index === 0 && products.length > 0) ||
            (index === 1 && Boolean(session)) ||
            (index === 2 && Boolean(cart?.items.length)) ||
            (index === 3 && Boolean(orderFulfilled));
          return (
            <a key={item.id} className={`flow-step${isComplete ? ' is-complete' : ''}`} href={`#${item.id}`}>
              <span>0{index + 1}</span>
              <strong>{item.label}</strong>
            </a>
          );
        })}
        <div className={`flow-status${checkoutReady ? ' is-ready' : ''}`}>
          <strong>{checkoutReady ? 'Checkout ready' : 'Action needed'}</strong>
          <span>{checkoutReady ? 'You can create the order now.' : 'Sign in, choose items, and save an address.'}</span>
        </div>
      </section>

      {/* ── Catalog ── */}
      <section className="container stacked-section" id="catalog">
        <div className="section-head">
          <div>
            <span className="eyebrow">Catalog</span>
            <h2>Browse products and add to cart.</h2>
          </div>
          <p>Filter by category, add items to the cart, and move directly into checkout.</p>
        </div>
        <div className="category-chips">
          <button type="button" className={`chip-button${selectedCategoryId === 'all' ? ' is-active' : ''}`} onClick={() => void handleCategorySelect('all')}>All products</button>
          {categories.map((cat) => (
            <button key={cat.id} type="button" className={`chip-button${selectedCategoryId === cat.id ? ' is-active' : ''}`} onClick={() => void handleCategorySelect(cat.id)}>{cat.name}</button>
          ))}
        </div>
        {catalogState === 'loading' ? <p className="helper-copy">Loading products…</p> : null}
        {catalogState === 'error' ? <p className="form-message error">{catalogMessage}</p> : null}
        <div className="catalog-grid">
          {filteredProducts.map((product) => (
            <article key={product.id} className="product-card">
              <div className="product-media">
                {product.images[0] ? <img src={product.images[0]} alt={product.name} /> : <div className="product-placeholder">{product.name.slice(0, 1)}</div>}
              </div>
              <div className="product-content">
                <div className="product-title-row">
                  <h3>{product.name}</h3>
                  <strong>{formatMoney(product.price)}</strong>
                </div>
                <p>{product.description ?? 'Freshly prepared and ready for repeat ordering.'}</p>
                <div className="product-tags">
                  {product.categories.map((c) => <span key={`${product.id}-${c}`} className="product-tag">{c}</span>)}
                </div>
              </div>
              <div className="product-footer">
                <button className="solid-button" type="button" onClick={() => void handleAddToCart(product.id)} disabled={busyProductId === product.id}>
                  {busyProductId === product.id ? 'Adding…' : 'Add to cart'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Account / Auth ── */}
      <section className="container customer-grid" id="account">
        <section className="panel auth-panel">
          <div className="section-head compact">
            <div>
              <span className="eyebrow">Account</span>
              <h2>{session ? 'Your profile & addresses.' : 'Sign in or create account.'}</h2>
            </div>
          </div>

          {!session ? (
            <div className="dual-form-grid">
              {/* Register */}
              <form className="auth-card" onSubmit={handleRegister}>
                <div className="auth-card-badge">✦ Create Account</div>
                <h3 className="serif">Join Us</h3>
                <p className="auth-sub">Create an account to save your favorites and track your orders.</p>
                {[
                  { field: 'user_name', label: 'Username', type: 'text', icon: '👤' },
                  { field: 'first_name', label: 'First Name', type: 'text', icon: '👤' },
                  { field: 'last_name', label: 'Last Name', type: 'text', icon: '👤' },
                  { field: 'phone', label: 'Phone', type: 'tel', icon: '📞' },
                  { field: 'email', label: 'Email', type: 'email', icon: '✉️' },
                  { field: 'password', label: 'Password', type: 'password', icon: '🔒' },
                ].map(({ field, label, type, icon }) => (
                  <div key={field} className="auth-input-wrap">
                    <span className="auth-icon">{icon}</span>
                    <input
                      type={type}
                      placeholder={label}
                      value={(registerForm as unknown as Record<string, string>)[field] ?? ''}
                      onChange={(e) => setRegisterForm((cur) => ({ ...cur, [field]: e.target.value }))}
                    />
                  </div>
                ))}
                <button className="solid-button auth-cta" type="submit">{authState === 'loading' ? 'Creating…' : 'Create Account →'}</button>
              </form>

              {/* Login */}
              <form className="auth-card" onSubmit={handleLogin}>
                <div className="auth-card-badge">✦ Login</div>
                <h3 className="serif">Welcome Back</h3>
                <p className="auth-sub">Sign in to your account to view your orders and favorites.</p>
                <div className="auth-input-wrap">
                  <span className="auth-icon">✉️</span>
                  <input type="email" placeholder="Email Address" value={loginForm.email} onChange={(e) => setLoginForm((c) => ({ ...c, email: e.target.value }))} />
                </div>
                <div className="auth-input-wrap">
                  <span className="auth-icon">🔒</span>
                  <input type="password" placeholder="Password" value={loginForm.password} onChange={(e) => setLoginForm((c) => ({ ...c, password: e.target.value }))} />
                </div>
                <button className="solid-button auth-cta" type="submit">{authState === 'loading' ? 'Signing in…' : 'Sign In →'}</button>
              </form>
            </div>
          ) : (
            <div>
              <div className="account-chip-row">
                <span className="status-pill">{session.user.email}</span>
                <span className="status-pill">{orders.length} orders</span>
                <span className="status-pill">{cart?.items.length ?? 0} cart items</span>
              </div>
              <form className="form-card" onSubmit={handleProfileSave} style={{ marginTop: 16 }}>
                <h3>Profile</h3>
                <div className="profile-grid">
                  <div className="avatar-block">
                    {profileForm.avatar_url
                      ? <img className="avatar-preview" src={profileForm.avatar_url} alt="Avatar" />
                      : <div className="avatar-preview avatar-fallback">{session.user.first_name.slice(0, 1)}</div>}
                    <input type="file" accept="image/*" onChange={(e) => void handleAvatarUpload(e)} />
                  </div>
                  <div className="profile-fields">
                    {[
                      { key: 'first_name', label: 'First name' },
                      { key: 'last_name', label: 'Last name' },
                      { key: 'phone', label: 'Phone' },
                      { key: 'avatar_url', label: 'Avatar URL' },
                    ].map(({ key, label }) => (
                      <label key={key}>{label}
                        <input value={(profileForm as unknown as Record<string, string>)[key] ?? ''} onChange={(e) => setProfileForm((c) => ({ ...c, [key]: e.target.value }))} />
                      </label>
                    ))}
                  </div>
                </div>
                <button className="solid-button" type="submit" style={{ marginTop: 14 }}>Save profile</button>
              </form>
            </div>
          )}
          {authMessage ? <p className={`form-message${authState === 'error' ? ' error' : ''}`}>{authMessage}</p> : null}
        </section>

        {/* Addresses */}
        <section className="panel">
          <div className="section-head compact">
            <div>
              <span className="eyebrow">Addresses</span>
              <h2>Save and edit delivery addresses.</h2>
            </div>
          </div>
          {session ? (
            <>
              <form className="form-card" onSubmit={handleAddressSubmit}>
                <h3>{editingAddressId ? 'Edit address' : 'Add address'}</h3>
                <div className="form-grid two-up">
                  {[
                    { key: 'full_name', label: 'Full name', span: false },
                    { key: 'phone', label: 'Phone', span: false },
                    { key: 'line_1', label: 'Address line 1', span: true },
                    { key: 'line_2', label: 'Address line 2', span: true },
                    { key: 'city', label: 'City', span: false },
                    { key: 'state', label: 'State', span: false },
                    { key: 'postal_code', label: 'Postal code', span: false },
                    { key: 'country', label: 'Country', span: false },
                    { key: 'landmark', label: 'Landmark', span: true },
                  ].map(({ key, label, span }) => (
                    <label key={key} className={span ? 'span-2' : ''}>{label}
                      <input value={(addressForm as unknown as Record<string, string>)[key] ?? ''} onChange={(e) => setAddressForm((c) => ({ ...c, [key]: e.target.value }))} />
                    </label>
                  ))}
                </div>
                <label className="checkbox-row">
                  <input type="checkbox" checked={addressForm.is_default} onChange={(e) => setAddressForm((c) => ({ ...c, is_default: e.target.checked }))} />
                  Set as default address
                </label>
                <div className="inline-actions">
                  <button className="solid-button" type="submit">{addressState === 'loading' ? 'Saving…' : editingAddressId ? 'Update address' : 'Save address'}</button>
                  {editingAddressId ? <button className="outline-button" type="button" onClick={() => { setEditingAddressId(null); setAddressForm(emptyAddressForm); }}>Cancel</button> : null}
                </div>
              </form>
              <div className="list-stack" style={{ marginTop: 16 }}>
                {addresses.map((addr) => (
                  <article key={addr.id} className="list-card">
                    <div className="list-title-row">
                      <strong>{addr.full_name}</strong>
                      {addr.is_default ? <span className="status-pill">Default</span> : null}
                    </div>
                    <p>{addr.line_1}{addr.line_2 ? `, ${addr.line_2}` : ''}, {addr.city}, {addr.state} {addr.postal_code}</p>
                    <p>{addr.phone} · {addr.country}</p>
                    <div className="inline-actions">
                      <button className="outline-button" type="button" onClick={() => startAddressEdit(addr)}>Edit</button>
                      <button className="ghost-inline danger" type="button" onClick={() => void handleAddressDelete(addr.id)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p className="helper-copy">Login to manage delivery addresses.</p>
          )}
          {addressMessage ? <p className={`form-message${addressState === 'error' ? ' error' : ''}`}>{addressMessage}</p> : null}
        </section>
      </section>

      {/* ── Cart & Checkout ── */}
      <section className="container customer-grid wide" id="cart">
        <section className="panel">
          <div className="section-head compact">
            <div><span className="eyebrow">Cart</span><h2>Review the cart before checkout.</h2></div>
          </div>
          {session
            ? cart && cart.items.length
              ? <div className="list-stack">
                {cart.items.map((item) => (
                  <article key={item.id} className="list-card">
                    <div className="cart-line">
                      <div className="thumb-wrap">{item.images[0] ? <img src={item.images[0]} alt={item.product_name} /> : null}</div>
                      <div>
                        <strong>{item.product_name}</strong>
                        <p>{formatMoney(item.unit_price)} each · {formatMoney(item.line_total)}</p>
                      </div>
                    </div>
                    <div className="cart-actions">
                      <button type="button" onClick={() => void handleCartQuantity(item.id, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => void handleCartQuantity(item.id, item.quantity + 1)}>+</button>
                      <button className="ghost-inline danger" type="button" onClick={() => void handleCartDelete(item.id)}>Remove</button>
                    </div>
                  </article>
                ))}
              </div>
              : <p className="helper-copy">Your cart is empty. Add products from the menu first.</p>
            : <p className="helper-copy">Login to keep a cart and move into checkout.</p>}
        </section>

        <section className="panel">
          <div className="section-head compact">
            <div><span className="eyebrow">Checkout</span><h2>Create order, then launch payment.</h2></div>
          </div>
          <div className="summary-card">
            <div><span>Cart total</span><strong>{formatMoney(cart?.total_amount ?? 0)}</strong></div>
            <div><span>Default address</span><strong>{defaultAddress?.city ?? 'Not selected'}</strong></div>
            <div><span>Latest order</span><strong>{checkoutResult?.order_number ?? 'Not created yet'}</strong></div>
          </div>
          <div className="stack-actions">
            <button className="solid-button" type="button" onClick={() => void handleCheckout()}>Create order</button>
            <button className="outline-button" type="button" onClick={() => void handlePaymentLaunch()}>Pay with Razorpay</button>
            {checkoutResult ? <a className="ghost-button" href="#orders">Review latest order</a> : null}
          </div>
          {orderMessage ? <p className="form-message">{orderMessage}</p> : null}
          {paymentMessage ? <p className="form-message">{paymentMessage}</p> : null}
          {selectedOrder ? (
            <article className="detail-card">
              <div className="list-title-row"><strong>{selectedOrder.order_number}</strong><span className="status-pill">{selectedOrder.payment_status}</span></div>
              <p>{selectedOrder.status} · {formatMoney(selectedOrder.total_amount, selectedOrder.currency)}</p>
              <div className="mini-list">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="mini-row"><span>{item.product_name} x {item.quantity}</span><strong>{formatMoney(item.line_total, selectedOrder.currency)}</strong></div>
                ))}
              </div>
            </article>
          ) : null}
        </section>
      </section>

      {/* ── Orders ── */}
      <section className="container stacked-section" id="orders">
        <div className="section-head">
          <div><span className="eyebrow">Orders</span><h2>Placed orders and payment status.</h2></div>
          <p>Reopen any order to inspect the delivery address, item snapshot, and payment state.</p>
        </div>
        <div className="order-grid">
          <div className="list-stack">
            {orders.length
              ? orders.map((order) => (
                <article key={order.id} className="list-card">
                  <div className="list-title-row"><strong>{order.order_number}</strong><span className="status-pill">{order.payment_status}</span></div>
                  <p>{formatMoney(order.total_amount, order.currency)} · {order.status}</p>
                  <p>{formatDate(order.placed_on)}</p>
                  <button className="outline-button" type="button" onClick={() => void handleOrderOpen(order.id)}>View details</button>
                </article>
              ))
              : <p className="helper-copy">No orders yet.</p>}
          </div>
          <div className="panel">
            {selectedOrder ? (
              <>
                <div className="list-title-row"><strong>{selectedOrder.order_number}</strong><span className="status-pill">{selectedOrder.status}</span></div>
                <p className="helper-copy">{selectedOrder.payment_status === 'paid' ? 'Payment complete.' : 'Payment pending.'}</p>
                <p>{selectedOrder.address.full_name} · {selectedOrder.address.phone}</p>
                <p>{selectedOrder.address.line_1}{selectedOrder.address.line_2 ? `, ${selectedOrder.address.line_2}` : ''}, {selectedOrder.address.city}, {selectedOrder.address.state}</p>
                <div className="mini-list">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="mini-row"><span>{item.product_name} x {item.quantity}</span><strong>{formatMoney(item.line_total, selectedOrder.currency)}</strong></div>
                  ))}
                </div>
              </>
            ) : <p className="helper-copy">Select an order to inspect its details.</p>}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="container fade-up">
        <div className="footer-grid">
          <article className="card footer-card">
            <div className="brand" style={{ marginBottom: 12 }}>
              <span className="brand-mark" aria-hidden="true" />
              <span>
                <span className="serif" style={{ fontSize: 22, lineHeight: 1 }}>Mobilitea</span>
                <small>Sip. Energize. Repeat.</small>
              </span>
            </div>
            <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.75 }}>Premium refreshment for workplaces, events, and institutions — designed to feel reliable, polished, and easy to scale.</p>
          </article>
          <article className="card footer-card">
            <h3>Menu</h3>
            <ul><li>Hot beverages</li><li>Coolers</li><li>Snacks</li><li>Desserts</li></ul>
          </article>
          <article className="card footer-card">
            <h3>Company</h3>
            <ul><li>Why Mobilitea</li><li>Our process</li><li>Who we serve</li><li>Corporate quotes</li></ul>
          </article>
          <article className="card footer-card">
            <h3>Account</h3>
            <ul>
              <li><a href="#account">{session ? `Signed in as ${session.user.first_name}` : 'Sign in'}</a></li>
              <li><a href="#cart">Cart ({cart?.items.length ?? 0})</a></li>
              <li><a href="#orders">Orders ({orders.length})</a></li>
            </ul>
          </article>
        </div>
        <div className="footer-bottom">© 2026 Mobilitea. All rights reserved.</div>
      </footer>
    </main>
  );
}
