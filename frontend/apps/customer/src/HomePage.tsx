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
  getOrder,
  getOrders,
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
  CheckoutResult,
  CustomerAuthResponse,
  CustomerRegisterInput,
  CategoryListItem,
  LoginInput,
  OrderDetail,
  OrderSummary,
} from '@tea-time/types';

import { AccountSection } from './components/AccountSection';
import { CartSection } from './components/CartSection';
import { HeroSlider } from './components/HeroSlider';
import { CategoriesSection, HowWeBrew } from './components/MarketingContent';
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
    title: 'Refreshment That Moves with Your Workday.',
    subtitle: 'Daily Workplace Refreshment',
    description:
      'Daily delivery of hot & cold beverages - tea, coffee, fresh juices - plus snacks, served at your workplace morning and evening, through a hassle-free subscription. MOBILITEA is on a mission to create a complete refreshment solution ecosystem - reliable, refreshing, and made for workspaces.',
    primary_button_label: 'SUBSCRIBE NOW',
    primary_button_href: '#account',
    secondary_button_label: null,
    secondary_button_href: null,
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
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('mt-theme') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mt-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const [banners, setBanners] = useState<Banner[]>(fallbackBanners);
  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [categoriesState, setCategoriesState] = useState<AsyncState>('loading');
  const [categoriesMessage, setCategoriesMessage] = useState('');

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

  useEffect(() => {
    void loadPublicData();
    void restoreSession();
  }, []);

  // Auto-advance hero slider
  useEffect(() => {
    if (banners.length < 2) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setActiveSlide((c) => (c + 1) % banners.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [banners.length]);

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

  async function loadPublicData() {
    setCategoriesState('loading');
    setCategoriesMessage('');

    const [bannerResult, categoryResult] = await Promise.allSettled([getBanners(), getCategories()]);

    if (bannerResult.status === 'fulfilled') {
      setBanners(bannerResult.value.items.length ? bannerResult.value.items : fallbackBanners);
    } else {
      setBanners(fallbackBanners);
      console.error(bannerResult.reason);
    }

    if (categoryResult.status === 'fulfilled') {
      setCategories(categoryResult.value.items);
      setCategoriesState('ready');
    } else {
      setCategories([]);
      setCategoriesState('error');
      setCategoriesMessage(
        categoryResult.reason instanceof Error
          ? categoryResult.reason.message
          : 'Failed to load categories',
      );
      console.error(categoryResult.reason);
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
            <a href="#categories">Menu</a>
            <a href="#ritual">Process</a>
            <a href="#contact">Contact</a>
          </nav>
          <div className="header-actions">
            <button
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <a className="solid-button btn-cta-pulse" href="#categories">
              Subscribe
            </a>
          </div>
        </div>
      </header>

      <HeroSlider banners={banners} activeSlide={activeSlide} onSlideChange={setActiveSlide} />

      <CategoriesSection
        categories={categories}
        state={categoriesState}
        message={categoriesMessage}
      />
      <HowWeBrew />

      {/* Footer */}
      <footer className="site-footer fade-up" id="contact">
        <div className="container">
          {/* CTA Strip */}
          <div className="footer-cta-strip">
            <div className="cta-text">
              <h2 className="serif">Ready to Energize Your Workplace?</h2>
              <p>Start your subscription today. Free 3-day trial.</p>
            </div>
            <a className="solid-button" href="#categories">
              Get Started Free →
            </a>
          </div>

          <div className="footer-grid">
            <article className="footer-col brand-col">
              <img src="/assets/logo.webp" alt="Mobilitea Logo" className="logo" />
              <p className="brand-desc">
                India's complete workplace refreshment ecosystem. Freshly brewed. Always on time.
              </p>
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
