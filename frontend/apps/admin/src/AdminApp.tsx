import React, { useEffect, useState } from 'react';

import {
  createBanner,
  createCategory,
  createProduct,
  createUser,
  deleteBanner,
  deleteCategory,
  deleteProduct,
  getAdminHealth,
  getBanners,
  getCategories,
  getCurrentAdmin,
  getOrder,
  getOrders,
  getPayment,
  getPayments,
  getProducts,
  getUser,
  getUsers,
  logoutAdmin,
  updateBanner,
  updateCategory,
  updateOrderStatus,
  updateProduct,
  uploadFile,
} from '@tea-time/api-client';
import type {
  AdminAuthResponse,
  Banner,
  BannerInput,
  CategoryInput,
  CategoryListItem,
  CreateCustomerInput,
  CustomerDetailResponse,
  DashboardSummary,
  HealthResponse,
  OrderDetail,
  OrderSummary,
  PaymentDetailResponse,
  PaymentRecord,
  ProductInput,
  ProductListItem,
  CustomerListItem,
} from '@tea-time/types';

import { LoginPage } from './components/LoginPage';
import { BannersSection, CustomersSection } from './components/BannersSection';
import {
  CategoriesSection,
  ProductsSection,
  type CategoryFormState,
  type ProductFormState,
} from './components/CatalogSection';
import { OrdersSection, PaymentsSection } from './components/OrdersSection';
import { OverviewSection } from './components/OverviewSection';
import { imageFieldToString, parseImageField } from './lib/format';

type DashboardSectionKey =
  | 'overview'
  | 'categories'
  | 'products'
  | 'banners'
  | 'customers'
  | 'orders'
  | 'payments';

interface DashboardSection {
  key: DashboardSectionKey;
  id: string;
  label: string;
}

const dashboardSections: DashboardSection[] = [
  { key: 'overview', id: 'admin-overview', label: 'Overview' },
  { key: 'categories', id: 'admin-categories', label: 'Categories' },
  { key: 'products', id: 'admin-products', label: 'Products' },
  { key: 'banners', id: 'admin-banners', label: 'Banners' },
  { key: 'customers', id: 'admin-customers', label: 'Customers' },
  { key: 'orders', id: 'admin-orders', label: 'Orders' },
  { key: 'payments', id: 'admin-payments', label: 'Payments' },
];

const emptyCategory: CategoryFormState = { id: '', name: '', imagesText: '' };

const emptyProduct: ProductFormState = {
  id: '',
  name: '',
  imagesText: '',
  price: '0',
  description: '',
  categoryIds: [],
};

const emptyBanner: BannerInput = {
  title: '',
  subtitle: '',
  description: '',
  primary_button_label: '',
  primary_button_href: '#categories',
  secondary_button_label: '',
  secondary_button_href: '#customers',
  media_url: '',
  media_kind: 'image',
  background_type: 'image',
  background_value: '/assets/home-Dr3wWsX4.webp',
  overlay_color: 'rgba(17, 24, 18, 0.24)',
  text_color: '#ffffff',
  sort_order: 1,
  is_active: true,
};

const emptyUser: CreateCustomerInput = {
  user_name: '',
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  password: '',
};

function sectionFromHash(hash: string): DashboardSectionKey {
  const normalized = hash.replace(/^#/, '');
  const match = dashboardSections.find((section) => section.id === normalized);
  return match?.key ?? 'overview';
}

function sectionId(section: DashboardSectionKey): string {
  return dashboardSections.find((item) => item.key === section)?.id ?? 'admin-overview';
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isSessionError(message: string): boolean {
  return /admin session/i.test(message);
}

function createResetState(setters: {
  setHealth: (value: HealthResponse | null) => void;
  setSummary: (value: DashboardSummary | null) => void;
  setCategories: (value: CategoryListItem[]) => void;
  setProducts: (value: ProductListItem[]) => void;
  setBanners: (value: Banner[]) => void;
  setUsers: (value: CustomerListItem[]) => void;
  setOrders: (value: OrderSummary[]) => void;
  setPayments: (value: PaymentRecord[]) => void;
  setSelectedUser: (value: CustomerDetailResponse | null) => void;
  setSelectedOrder: (value: OrderDetail | null) => void;
  setSelectedPayment: (value: PaymentDetailResponse | null) => void;
  setCategoryForm: (value: CategoryFormState) => void;
  setProductForm: (value: ProductFormState) => void;
  setBannerForm: (value: BannerInput) => void;
  setBannerEditingId: (value: string) => void;
  setUserForm: (value: CreateCustomerInput) => void;
  setMessage: (value: string) => void;
}) {
  setters.setHealth(null);
  setters.setSummary(null);
  setters.setCategories([]);
  setters.setProducts([]);
  setters.setBanners([]);
  setters.setUsers([]);
  setters.setOrders([]);
  setters.setPayments([]);
  setters.setSelectedUser(null);
  setters.setSelectedOrder(null);
  setters.setSelectedPayment(null);
  setters.setCategoryForm(emptyCategory);
  setters.setProductForm(emptyProduct);
  setters.setBannerForm(emptyBanner);
  setters.setBannerEditingId('');
  setters.setUserForm(emptyUser);
  setters.setMessage('');
}

export function AdminApp() {
  const [session, setSession] = useState<AdminAuthResponse | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [activeSection, setActiveSection] = useState<DashboardSectionKey>('overview');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [message, setMessage] = useState('');

  const [categories, setCategories] = useState<CategoryListItem[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [users, setUsers] = useState<CustomerListItem[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  const [selectedUser, setSelectedUser] = useState<CustomerDetailResponse | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<PaymentDetailResponse | null>(null);

  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategory);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProduct);
  const [bannerForm, setBannerForm] = useState<BannerInput>(emptyBanner);
  const [bannerEditingId, setBannerEditingId] = useState('');
  const [userForm, setUserForm] = useState<CreateCustomerInput>(emptyUser);

  const resetDashboard = () =>
    createResetState({
      setHealth,
      setSummary,
      setCategories,
      setProducts,
      setBanners,
      setUsers,
      setOrders,
      setPayments,
      setSelectedUser,
      setSelectedOrder,
      setSelectedPayment,
      setCategoryForm,
      setProductForm,
      setBannerForm,
      setBannerEditingId,
      setUserForm,
      setMessage,
    });

  async function loadDashboardData() {
    const results = await Promise.allSettled([
      getAdminHealth(),
      getCategories('admin'),
      getProducts('admin'),
      getBanners('admin'),
      getUsers(),
      getOrders('admin'),
      getPayments(),
    ]);

    const [healthResult, categoriesResult, productsResult, bannersResult, usersResult, ordersResult, paymentsResult] =
      results;

    const errors: string[] = [];
    let authExpired = false;

    function applyError(result: PromiseSettledResult<unknown>) {
      if (result.status === 'fulfilled') return;
      const errorMessage = getErrorMessage(result.reason);
      errors.push(errorMessage);
      if (isSessionError(errorMessage)) authExpired = true;
    }

    if (healthResult.status === 'fulfilled') {
      setHealth(healthResult.value);
      setSummary(healthResult.value.summary ?? null);
    } else {
      applyError(healthResult);
      setHealth(null);
      setSummary(null);
    }

    if (categoriesResult.status === 'fulfilled') {
      setCategories(categoriesResult.value.items);
    } else {
      applyError(categoriesResult);
      setCategories([]);
    }

    if (productsResult.status === 'fulfilled') {
      setProducts(productsResult.value.items);
    } else {
      applyError(productsResult);
      setProducts([]);
    }

    if (bannersResult.status === 'fulfilled') {
      setBanners(bannersResult.value.items);
    } else {
      applyError(bannersResult);
      setBanners([]);
    }

    if (usersResult.status === 'fulfilled') {
      setUsers(usersResult.value.items);
    } else {
      applyError(usersResult);
      setUsers([]);
    }

    if (ordersResult.status === 'fulfilled') {
      setOrders(ordersResult.value.items);
    } else {
      applyError(ordersResult);
      setOrders([]);
    }

    if (paymentsResult.status === 'fulfilled') {
      setPayments(paymentsResult.value.items);
    } else {
      applyError(paymentsResult);
      setPayments([]);
    }

    if (authExpired) {
      resetDashboard();
      setSession(null);
      if (typeof window !== 'undefined') {
        window.location.hash = '';
      }
      return;
    }

    if (errors.length > 0) {
      setMessage(errors[0]);
    }
  }

  async function bootstrap() {
    try {
      const current = await getCurrentAdmin();
      setSession(current);
      if (typeof window !== 'undefined' && !window.location.hash) {
        window.location.hash = `#${sectionId('overview')}`;
      }
      await loadDashboardData();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setSession(null);
      resetDashboard();
      if (!isSessionError(errorMessage)) {
        setMessage(errorMessage);
      }
    } finally {
      setBootstrapping(false);
    }
  }

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const syncSection = () => {
      if (!session) return;
      setActiveSection(sectionFromHash(window.location.hash));
    };

    syncSection();
    window.addEventListener('hashchange', syncSection);
    return () => window.removeEventListener('hashchange', syncSection);
  }, [session]);

  useEffect(() => {
    if (!session || typeof window === 'undefined') return;
    if (!window.location.hash || sectionFromHash(window.location.hash) === 'overview' && window.location.hash !== `#${sectionId('overview')}`) {
      window.location.hash = `#${sectionId('overview')}`;
    }
  }, [session]);

  async function handleLoginSuccess(nextSession: AdminAuthResponse) {
    setSession(nextSession);
    setMessage('');
    if (typeof window !== 'undefined' && !window.location.hash) {
      window.location.hash = `#${sectionId('overview')}`;
    }
    await loadDashboardData();
    setBootstrapping(false);
  }

  async function handleLogout() {
    try {
      await logoutAdmin();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (!isSessionError(errorMessage)) {
        setMessage(errorMessage);
      }
    } finally {
      setSession(null);
      setActiveSection('overview');
      resetDashboard();
      if (typeof window !== 'undefined') {
        window.location.hash = '';
      }
      setBootstrapping(false);
    }
  }

  async function handleFileAppend(
    event: React.ChangeEvent<HTMLInputElement>,
    target: 'category' | 'product' | 'banner' | 'banner-background',
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const response = await uploadFile(file);
      if (target === 'category') {
        setCategoryForm((current: CategoryFormState) => ({
          ...current,
          imagesText: current.imagesText ? `${current.imagesText}\n${response.file_url}` : response.file_url,
        }));
      } else if (target === 'product') {
        setProductForm((current: ProductFormState) => ({
          ...current,
          imagesText: current.imagesText ? `${current.imagesText}\n${response.file_url}` : response.file_url,
        }));
      } else if (target === 'banner-background') {
        setBannerForm((current: BannerInput) => ({ ...current, background_value: response.file_url }));
      } else {
        setBannerForm((current: BannerInput) => ({ ...current, media_url: response.file_url }));
      }
      setMessage('File uploaded.');
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      event.target.value = '';
    }
  }

  async function submitCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: CategoryInput = {
      name: categoryForm.name,
      images: parseImageField(categoryForm.imagesText),
    };
    try {
      if (categoryForm.id) {
        await updateCategory(categoryForm.id, payload);
        setMessage('Category updated.');
      } else {
        await createCategory(payload);
        setMessage('Category created.');
      }
      setCategoryForm(emptyCategory);
      await loadDashboardData();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (isSessionError(errorMessage)) {
        await handleLogout();
        return;
      }
      setMessage(errorMessage);
    }
  }

  async function submitProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: ProductInput = {
      name: productForm.name,
      images: parseImageField(productForm.imagesText),
      price: Number(productForm.price),
      description: productForm.description || null,
      category_ids: productForm.categoryIds,
    };
    try {
      if (productForm.id) {
        await updateProduct(productForm.id, payload);
        setMessage('Product updated.');
      } else {
        await createProduct(payload);
        setMessage('Product created.');
      }
      setProductForm(emptyProduct);
      await loadDashboardData();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (isSessionError(errorMessage)) {
        await handleLogout();
        return;
      }
      setMessage(errorMessage);
    }
  }

  async function submitBanner(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      if (bannerEditingId) {
        await updateBanner(bannerEditingId, bannerForm);
        setMessage('Banner updated.');
      } else {
        await createBanner(bannerForm);
        setMessage('Banner created.');
      }
      setBannerEditingId('');
      setBannerForm(emptyBanner);
      await loadDashboardData();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (isSessionError(errorMessage)) {
        await handleLogout();
        return;
      }
      setMessage(errorMessage);
    }
  }

  async function submitUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await createUser({ ...userForm, phone: userForm.phone || null });
      setUserForm(emptyUser);
      setMessage('Customer account created.');
      await loadDashboardData();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (isSessionError(errorMessage)) {
        await handleLogout();
        return;
      }
      setMessage(errorMessage);
    }
  }

  async function openUser(id: string) {
    try {
      setSelectedUser(await getUser(id));
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (isSessionError(errorMessage)) {
        await handleLogout();
        return;
      }
      setMessage(errorMessage);
    }
  }

  async function openOrder(id: string) {
    try {
      setSelectedOrder(await getOrder(id, 'admin'));
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (isSessionError(errorMessage)) {
        await handleLogout();
        return;
      }
      setMessage(errorMessage);
    }
  }

  async function changeOrderStatus(id: string, status: string) {
    try {
      await updateOrderStatus(id, status);
      setMessage(`Order status updated to ${status}.`);
      await loadDashboardData();
      if (selectedOrder?.id === id) {
        await openOrder(id);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (isSessionError(errorMessage)) {
        await handleLogout();
        return;
      }
      setMessage(errorMessage);
    }
  }

  async function openPayment(id: string) {
    try {
      setSelectedPayment(await getPayment(id));
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (isSessionError(errorMessage)) {
        await handleLogout();
        return;
      }
      setMessage(errorMessage);
    }
  }

  function editCategory(category: CategoryListItem) {
    setCategoryForm({
      id: category.id,
      name: category.name,
      imagesText: imageFieldToString(category.images),
    });
  }

  function editProduct(product: ProductListItem) {
    setProductForm({
      id: product.id,
      name: product.name,
      imagesText: imageFieldToString(product.images),
      price: String(product.price),
      description: product.description ?? '',
      categoryIds: product.category_ids,
    });
  }

  function editBanner(banner: Banner) {
    setBannerEditingId(banner.id);
    setBannerForm({
      title: banner.title,
      subtitle: banner.subtitle,
      description: banner.description,
      primary_button_label: banner.primary_button_label,
      primary_button_href: banner.primary_button_href,
      secondary_button_label: banner.secondary_button_label,
      secondary_button_href: banner.secondary_button_href,
      media_url: banner.media_url,
      media_kind: banner.media_kind === 'video' ? 'video' : 'image',
      background_type:
        banner.background_type === 'image' ||
        banner.background_type === 'video' ||
        banner.background_type === 'solid'
          ? banner.background_type
          : 'gradient',
      background_value: banner.background_value,
      overlay_color: banner.overlay_color,
      text_color: banner.text_color,
      sort_order: banner.sort_order,
      is_active: banner.is_active,
    });
  }

  async function removeCategory(id: string) {
    try {
      await deleteCategory(id);
      await loadDashboardData();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (isSessionError(errorMessage)) {
        await handleLogout();
        return;
      }
      setMessage(errorMessage);
    }
  }

  async function removeProduct(id: string) {
    try {
      await deleteProduct(id);
      await loadDashboardData();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (isSessionError(errorMessage)) {
        await handleLogout();
        return;
      }
      setMessage(errorMessage);
    }
  }

  async function removeBanner(id: string) {
    try {
      await deleteBanner(id);
      await loadDashboardData();
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      if (isSessionError(errorMessage)) {
        await handleLogout();
        return;
      }
      setMessage(errorMessage);
    }
  }

  if (!session) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} checkingSession={bootstrapping} />;
  }

  const currentSession = session;
  const activeSectionLabel = dashboardSections.find((item) => item.key === activeSection)?.label ?? 'Overview';

  function renderSection() {
    switch (activeSection) {
      case 'categories':
        return (
          <CategoriesSection
            categories={categories}
            categoryForm={categoryForm}
            onCategoryFormChange={(patch) =>
              setCategoryForm((current: CategoryFormState) => ({ ...current, ...patch }))
            }
            onSubmitCategory={(event) => void submitCategory(event)}
            onEditCategory={editCategory}
            onDeleteCategory={(id) => void removeCategory(id)}
            onFileAppend={(event) => void handleFileAppend(event, 'category')}
          />
        );
      case 'products':
        return (
          <ProductsSection
            categories={categories}
            products={products}
            productForm={productForm}
            onProductFormChange={(patch) =>
              setProductForm((current: ProductFormState) => ({ ...current, ...patch }))
            }
            onSubmitProduct={(event) => void submitProduct(event)}
            onEditProduct={editProduct}
            onDeleteProduct={(id) => void removeProduct(id)}
            onFileAppend={(event) => void handleFileAppend(event, 'product')}
          />
        );
      case 'banners':
        return (
          <BannersSection
            banners={banners}
            bannerForm={bannerForm}
            bannerEditingId={bannerEditingId}
            onBannerFormChange={(patch) =>
              setBannerForm((current: BannerInput) => ({ ...current, ...patch }))
            }
            onSubmitBanner={(event) => void submitBanner(event)}
            onEditBanner={editBanner}
            onDeleteBanner={(id) => void removeBanner(id)}
            onFileAppend={(event, target) => void handleFileAppend(event, target)}
          />
        );
      case 'customers':
        return (
          <CustomersSection
            users={users}
            userForm={userForm}
            selectedUser={selectedUser}
            onUserFormChange={(patch) => setUserForm((current) => ({ ...current, ...patch }))}
            onSubmitUser={(event) => void submitUser(event)}
            onOpenUser={(id) => void openUser(id)}
          />
        );
      case 'orders':
        return (
          <OrdersSection
            orders={orders}
            selectedOrder={selectedOrder}
            onChangeOrderStatus={(id, status) => void changeOrderStatus(id, status)}
            onOpenOrder={(id) => void openOrder(id)}
          />
        );
      case 'payments':
        return (
          <PaymentsSection
            payments={payments}
            selectedPayment={selectedPayment}
            onOpenPayment={(id) => void openPayment(id)}
          />
        );
      case 'overview':
      default:
        return <OverviewSection health={health} summary={summary} session={currentSession} />;
    }
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <p className="admin-eyebrow">Tea Time Admin</p>
          <h1>Dashboard</h1>
          <p className="admin-sidebar-copy">{session.admin.email}</p>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin sections">
          {dashboardSections.map((item) => (
            <a
              key={item.id}
              className={`admin-sidebar-link${activeSection === item.key ? ' is-active' : ''}`}
              href={`#${item.id}`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <span className="admin-badge">
            {health?.database ? 'Database ready' : 'Checking backend'}
          </span>
          <button type="button" className="admin-logout" onClick={() => void handleLogout()}>
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <header className="admin-content-header">
          <div>
            <p className="admin-eyebrow">Active section</p>
            <h2>{activeSectionLabel}</h2>
          </div>
          {message ? <p className="admin-banner-message">{message}</p> : null}
        </header>

        <div className="admin-content-body">{renderSection()}</div>
      </main>
    </div>
  );
}
