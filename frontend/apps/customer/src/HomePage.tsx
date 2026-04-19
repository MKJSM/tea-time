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

  const currentBanner = banners[activeSlide] ?? fallbackBanners[0];
  const defaultAddress = addresses.find((address) => address.is_default) ?? null;
  const checkoutReady = Boolean(session && defaultAddress && cart?.items.length);
  const orderFulfilled = selectedOrder?.payment_status === 'paid';
  const filteredProducts =
    selectedCategoryId === 'all'
      ? products
      : products.filter((product) => product.category_ids.includes(selectedCategoryId));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % Math.max(banners.length, 1));
    }, 5000);

    return () => window.clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    void loadPublicData();
    void restoreSession();
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
      setOrderMessage('Login before adding products to the cart.');
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
    if (!addresses.length) {
      setOrderMessage('Create at least one address before checkout.');
      return;
    }

    try {
      const selectedAddress = addresses.find((address) => address.is_default) ?? addresses[0];
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
    <main className="landing-page">
      <header className="site-header">
        <div className="page-shell header-row">
          <a className="brand" href="#home">
            <span className="brand-mark" aria-hidden="true" />
            <span>
              Tea Time
              <small>Customer Flow</small>
            </span>
          </a>

          <nav className="site-nav">
            <a href="#catalog">Menu</a>
            <a href="#account">Account</a>
            <a href="#cart">Cart</a>
            <a href="#orders">Orders</a>
          </nav>

          <div className="header-actions">
            <span className="status-pill">{health?.ok ? 'API online' : 'Loading'}</span>
            {session ? (
              <button className="outline-button" type="button" onClick={handleLogout}>
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

      <section className="hero-section" id="home">
        <div className="hero-slider">
          {banners.map((banner, index) => {
            const isActive = index === activeSlide;
            const textColor = banner.text_color ?? '#ffffff';
            const isImageBanner = banner.background_type === 'image' && banner.media_url;
            const isVideoBanner = banner.background_type === 'video' && banner.media_url;

            return (
              <article
                key={banner.id}
                className={`hero-slide${isActive ? ' is-active' : ''}`}
                aria-hidden={!isActive}
              >
                <div className="hero-slide-background" style={bannerStyle(banner)}>
                  {isVideoBanner ? (
                    <video
                      className="hero-media"
                      src={banner.media_url ?? undefined}
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  ) : null}
                  {isImageBanner ? (
                    <div
                      className="hero-media hero-media-image"
                      style={{ backgroundImage: `url(${banner.media_url})` }}
                    />
                  ) : null}
                </div>
                <div
                  className="hero-overlay"
                  style={{ background: banner.overlay_color ?? 'rgba(16, 22, 16, 0.28)' }}
                />
                <div className="hero-slide-content">
                  <div className="hero-copy" style={{ color: textColor }}>
                    {banner.subtitle ? <span className="eyebrow">{banner.subtitle}</span> : null}
                    <h1>{banner.title}</h1>
                    {banner.description ? <p className="hero-body">{banner.description}</p> : null}
                    <div className="hero-actions-row">
                      {banner.primary_button_label ? (
                        <a
                          className="solid-button"
                          href={banner.primary_button_href ?? '#catalog'}
                        >
                          {banner.primary_button_label}
                        </a>
                      ) : null}
                      {banner.secondary_button_label ? (
                        <a
                          className="ghost-button"
                          href={banner.secondary_button_href ?? '#account'}
                        >
                          {banner.secondary_button_label}
                        </a>
                      ) : null}
                    </div>
                    <div className="hero-tags">
                      <span className="hero-tag">Scrollable banners</span>
                      <span className="hero-tag">Category-linked products</span>
                      <span className="hero-tag">Checkout and payment flow</span>
                    </div>
                  </div>

                  <aside className="hero-summary-card">
                    <p className="summary-kicker">Live storefront</p>
                    <strong className="hero-summary-label">{currentBanner.subtitle ?? 'Featured banner'}</strong>
                    <h2>{formatMoney(cart?.total_amount ?? 0)}</h2>
                    <div className="summary-grid">
                      <div>
                        <strong>{categories.length}</strong>
                        <span>Categories</span>
                      </div>
                      <div>
                        <strong>{products.length}</strong>
                        <span>Products</span>
                      </div>
                      <div>
                        <strong>{cart?.items.length ?? 0}</strong>
                        <span>Cart items</span>
                      </div>
                      <div>
                        <strong>{orders.length}</strong>
                        <span>Orders</span>
                      </div>
                    </div>
                    <p className="helper-copy">
                      Banner visuals are now driven from backend records instead of hardcoded slides.
                    </p>
                  </aside>
                </div>
              </article>
            );
          })}

          <div className="hero-indicators">
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                className={`hero-indicator${index === activeSlide ? ' is-active' : ''}`}
                onClick={() => setActiveSlide(index)}
                aria-label={`View banner ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="page-shell flow-rail" aria-label="Customer journey">
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

      <section className="page-shell stacked-section" id="catalog">
        <div className="section-head">
          <div>
            <span className="eyebrow">Catalog</span>
            <h2>Products stay linked to categories and filter instantly.</h2>
          </div>
          <p>
            The landing page reads the active banners, categories, and products from the live backend.
            Customers can filter by category and add items straight to the cart.
          </p>
        </div>

        <div className="category-chips">
          <button
            type="button"
            className={`chip-button${selectedCategoryId === 'all' ? ' is-active' : ''}`}
            onClick={() => void handleCategorySelect('all')}
          >
            All products
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`chip-button${selectedCategoryId === category.id ? ' is-active' : ''}`}
              onClick={() => void handleCategorySelect(category.id)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {catalogState === 'loading' ? <p className="helper-copy">Loading banners, categories, and products...</p> : null}
        {catalogState === 'error' ? <p className="form-message error">{catalogMessage}</p> : null}

        <div className="catalog-grid">
          {filteredProducts.map((product) => (
            <article key={product.id} className="product-card">
              <div className="product-media">
                {product.images[0] ? (
                  <img src={product.images[0]} alt={product.name} />
                ) : (
                  <div className="product-placeholder">{product.name.slice(0, 1)}</div>
                )}
              </div>
              <div className="product-content">
                <div className="product-title-row">
                  <h3>{product.name}</h3>
                  <strong>{formatMoney(product.price)}</strong>
                </div>
                <p>{product.description ?? 'Freshly prepared and ready for repeat ordering.'}</p>
                <div className="product-tags">
                  {product.categories.map((category) => (
                    <span key={`${product.id}-${category}`} className="product-tag">
                      {category}
                    </span>
                  ))}
                </div>
              </div>
              <div className="product-footer">
                <button
                  className="solid-button"
                  type="button"
                  onClick={() => void handleAddToCart(product.id)}
                  disabled={busyProductId === product.id}
                >
                  {busyProductId === product.id ? 'Adding...' : 'Add to cart'}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="page-shell customer-grid" id="account">
        <section className="panel auth-panel">
          <div className="section-head compact">
            <div>
              <span className="eyebrow">Account</span>
              <h2>{session ? 'Customer profile and address setup.' : 'Login or create an account.'}</h2>
            </div>
          </div>

          {!session ? (
            <div className="dual-form-grid">
              <form className="form-card" onSubmit={handleRegister}>
                <h3>Create account</h3>
                <label>
                  Username
                  <input
                    value={registerForm.user_name}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, user_name: event.target.value }))
                    }
                  />
                </label>
                <label>
                  First name
                  <input
                    value={registerForm.first_name}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, first_name: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Last name
                  <input
                    value={registerForm.last_name}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, last_name: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Phone
                  <input
                    value={registerForm.phone ?? ''}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, phone: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={registerForm.email}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, email: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={registerForm.password}
                    onChange={(event) =>
                      setRegisterForm((current) => ({ ...current, password: event.target.value }))
                    }
                  />
                </label>
                <button className="solid-button" type="submit">
                  {authState === 'loading' ? 'Creating...' : 'Create account'}
                </button>
              </form>

              <form className="form-card" onSubmit={handleLogin}>
                <h3>Login</h3>
                <label>
                  Email
                  <input
                    type="email"
                    value={loginForm.email}
                    onChange={(event) =>
                      setLoginForm((current) => ({ ...current, email: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Password
                  <input
                    type="password"
                    value={loginForm.password}
                    onChange={(event) =>
                      setLoginForm((current) => ({ ...current, password: event.target.value }))
                    }
                  />
                </label>
                <button className="outline-button" type="submit">
                  Sign in
                </button>
              </form>
            </div>
          ) : (
            <div className="account-stack">
              <div className="account-chip-row">
                <span className="status-pill">{session.user.email}</span>
                <span className="status-pill">{orders.length} orders</span>
                <span className="status-pill">{cart?.items.length ?? 0} cart items</span>
              </div>

              <form className="form-card" onSubmit={handleProfileSave}>
                <h3>Profile</h3>
                <div className="profile-grid">
                  <div className="avatar-block">
                    {profileForm.avatar_url ? (
                      <img className="avatar-preview" src={profileForm.avatar_url} alt="Avatar preview" />
                    ) : (
                      <div className="avatar-preview avatar-fallback">
                        {session.user.first_name.slice(0, 1)}
                      </div>
                    )}
                    <input type="file" accept="image/*" onChange={(event) => void handleAvatarUpload(event)} />
                  </div>

                  <div className="profile-fields">
                    <label>
                      First name
                      <input
                        value={profileForm.first_name}
                        onChange={(event) =>
                          setProfileForm((current) => ({ ...current, first_name: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Last name
                      <input
                        value={profileForm.last_name}
                        onChange={(event) =>
                          setProfileForm((current) => ({ ...current, last_name: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Phone
                      <input
                        value={profileForm.phone}
                        onChange={(event) =>
                          setProfileForm((current) => ({ ...current, phone: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Avatar URL
                      <input
                        value={profileForm.avatar_url}
                        onChange={(event) =>
                          setProfileForm((current) => ({ ...current, avatar_url: event.target.value }))
                        }
                      />
                    </label>
                  </div>
                </div>
                <button className="solid-button" type="submit">
                  Save profile
                </button>
              </form>
            </div>
          )}

          {authMessage ? (
            <p className={`form-message${authState === 'error' ? ' error' : ''}`}>{authMessage}</p>
          ) : null}
        </section>

        <section className="panel address-panel">
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
                  <label>
                    Full name
                    <input
                      value={addressForm.full_name}
                      onChange={(event) =>
                        setAddressForm((current) => ({ ...current, full_name: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Phone
                    <input
                      value={addressForm.phone}
                      onChange={(event) =>
                        setAddressForm((current) => ({ ...current, phone: event.target.value }))
                      }
                    />
                  </label>
                  <label className="span-2">
                    Address line 1
                    <input
                      value={addressForm.line_1}
                      onChange={(event) =>
                        setAddressForm((current) => ({ ...current, line_1: event.target.value }))
                      }
                    />
                  </label>
                  <label className="span-2">
                    Address line 2
                    <input
                      value={addressForm.line_2 ?? ''}
                      onChange={(event) =>
                        setAddressForm((current) => ({ ...current, line_2: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    City
                    <input
                      value={addressForm.city}
                      onChange={(event) =>
                        setAddressForm((current) => ({ ...current, city: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    State
                    <input
                      value={addressForm.state}
                      onChange={(event) =>
                        setAddressForm((current) => ({ ...current, state: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Postal code
                    <input
                      value={addressForm.postal_code}
                      onChange={(event) =>
                        setAddressForm((current) => ({ ...current, postal_code: event.target.value }))
                      }
                    />
                  </label>
                  <label>
                    Country
                    <input
                      value={addressForm.country ?? ''}
                      onChange={(event) =>
                        setAddressForm((current) => ({ ...current, country: event.target.value }))
                      }
                    />
                  </label>
                  <label className="span-2">
                    Landmark
                    <input
                      value={addressForm.landmark ?? ''}
                      onChange={(event) =>
                        setAddressForm((current) => ({ ...current, landmark: event.target.value }))
                      }
                    />
                  </label>
                </div>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={addressForm.is_default}
                    onChange={(event) =>
                      setAddressForm((current) => ({ ...current, is_default: event.target.checked }))
                    }
                  />
                  Set as default address
                </label>

                <div className="inline-actions">
                  <button className="solid-button" type="submit">
                    {addressState === 'loading'
                      ? 'Saving...'
                      : editingAddressId
                        ? 'Update address'
                        : 'Save address'}
                  </button>
                  {editingAddressId ? (
                    <button
                      className="outline-button"
                      type="button"
                      onClick={() => {
                        setEditingAddressId(null);
                        setAddressForm(emptyAddressForm);
                      }}
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>
              </form>

              <div className="list-stack">
                {addresses.map((address) => (
                  <article key={address.id} className="list-card">
                    <div>
                      <div className="list-title-row">
                        <strong>{address.full_name}</strong>
                        {address.is_default ? <span className="status-pill">Default</span> : null}
                      </div>
                      <p>
                        {address.line_1}
                        {address.line_2 ? `, ${address.line_2}` : ''}
                        {`, ${address.city}, ${address.state} ${address.postal_code}`}
                      </p>
                      <p>
                        {address.phone} · {address.country}
                      </p>
                    </div>
                    <div className="inline-actions">
                      <button className="outline-button" type="button" onClick={() => startAddressEdit(address)}>
                        Edit
                      </button>
                      <button
                        className="ghost-inline danger"
                        type="button"
                        onClick={() => void handleAddressDelete(address.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : (
            <p className="helper-copy">Login to manage customer addresses and default delivery info.</p>
          )}

          {addressMessage ? (
            <p className={`form-message${addressState === 'error' ? ' error' : ''}`}>{addressMessage}</p>
          ) : null}
        </section>
      </section>

      <section className="page-shell customer-grid wide" id="cart">
        <section className="panel">
          <div className="section-head compact">
            <div>
              <span className="eyebrow">Cart</span>
              <h2>Review the cart before creating the order.</h2>
            </div>
          </div>

          {session ? (
            cart && cart.items.length ? (
              <div className="list-stack">
                {cart.items.map((item) => (
                  <article key={item.id} className="list-card">
                    <div className="cart-line">
                      <div className="thumb-wrap">
                        {item.images[0] ? <img src={item.images[0]} alt={item.product_name} /> : null}
                      </div>
                      <div>
                        <strong>{item.product_name}</strong>
                        <p>
                          {formatMoney(item.unit_price)} each · {formatMoney(item.line_total)}
                        </p>
                      </div>
                    </div>
                    <div className="cart-actions">
                      <button type="button" onClick={() => void handleCartQuantity(item.id, item.quantity - 1)}>
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => void handleCartQuantity(item.id, item.quantity + 1)}>
                        +
                      </button>
                      <button className="ghost-inline danger" type="button" onClick={() => void handleCartDelete(item.id)}>
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="helper-copy">Your cart is empty. Add products from the menu first.</p>
            )
          ) : (
            <p className="helper-copy">Login to keep a cart and move into checkout.</p>
          )}
        </section>

        <section className="panel checkout-panel">
          <div className="section-head compact">
            <div>
              <span className="eyebrow">Checkout</span>
              <h2>Create order, then launch payment.</h2>
            </div>
          </div>

          <div className="summary-card">
            <div>
              <span>Cart total</span>
              <strong>{formatMoney(cart?.total_amount ?? 0)}</strong>
            </div>
            <div>
              <span>Default address</span>
              <strong>{defaultAddress?.city ?? 'Not selected'}</strong>
            </div>
            <div>
              <span>Latest order</span>
              <strong>{checkoutResult?.order_number ?? 'Not created yet'}</strong>
            </div>
          </div>

          <div className="stack-actions">
            <button className="solid-button" type="button" onClick={() => void handleCheckout()}>
              Create order
            </button>
            <button className="outline-button" type="button" onClick={() => void handlePaymentLaunch()}>
              Pay with Razorpay
            </button>
            {checkoutResult ? (
              <a className="ghost-button" href="#orders">
                Review latest order
              </a>
            ) : null}
          </div>

          {orderMessage ? <p className="form-message">{orderMessage}</p> : null}
          {paymentMessage ? <p className="form-message">{paymentMessage}</p> : null}

          {selectedOrder ? (
            <article className="detail-card">
              <div className="list-title-row">
                <strong>{selectedOrder.order_number}</strong>
                <span className="status-pill">{selectedOrder.payment_status}</span>
              </div>
              <p>
                {selectedOrder.status} · {formatMoney(selectedOrder.total_amount, selectedOrder.currency)}
              </p>
              <div className="mini-list">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="mini-row">
                    <span>
                      {item.product_name} x {item.quantity}
                    </span>
                    <strong>{formatMoney(item.line_total, selectedOrder.currency)}</strong>
                  </div>
                ))}
              </div>
            </article>
          ) : null}
        </section>
      </section>

      <section className="page-shell stacked-section" id="orders">
        <div className="section-head">
          <div>
            <span className="eyebrow">Orders</span>
            <h2>Placed orders and payment status remain visible.</h2>
          </div>
          <p>
            Customers can reopen any order to inspect the delivery address, item snapshot, and payment state.
          </p>
        </div>

        <div className="order-grid">
          <div className="list-stack">
            {orders.length ? (
              orders.map((order) => (
                <article key={order.id} className="list-card">
                  <div>
                    <div className="list-title-row">
                      <strong>{order.order_number}</strong>
                      <span className="status-pill">{order.payment_status}</span>
                    </div>
                    <p>
                      {formatMoney(order.total_amount, order.currency)} · {order.status}
                    </p>
                    <p>{formatDate(order.placed_on)}</p>
                  </div>
                  <button className="outline-button" type="button" onClick={() => void handleOrderOpen(order.id)}>
                    View details
                  </button>
                </article>
              ))
            ) : (
              <p className="helper-copy">No orders yet.</p>
            )}
          </div>

          <div className="panel detail-panel">
            {selectedOrder ? (
              <>
                <div className="list-title-row">
                  <strong>{selectedOrder.order_number}</strong>
                  <span className="status-pill">{selectedOrder.status}</span>
                </div>
                <p className="helper-copy">
                  {selectedOrder.payment_status === 'paid'
                    ? 'Payment complete.'
                    : 'Payment pending or awaiting verification.'}
                </p>
                <p>
                  {selectedOrder.address.full_name} · {selectedOrder.address.phone}
                </p>
                <p>
                  {selectedOrder.address.line_1}
                  {selectedOrder.address.line_2 ? `, ${selectedOrder.address.line_2}` : ''}
                  {`, ${selectedOrder.address.city}, ${selectedOrder.address.state}`}
                </p>
                <div className="mini-list">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="mini-row">
                      <span>
                        {item.product_name} x {item.quantity}
                      </span>
                      <strong>{formatMoney(item.line_total, selectedOrder.currency)}</strong>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="helper-copy">Select an order to inspect its address and item details.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
