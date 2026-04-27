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
  updateCategory,
  updateOrderStatus,
  updateProduct,
  updateBanner,
  uploadFile,
  deleteFile,
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
import { BannerEditorPage } from './components/BannerEditorPage';
import { BannersSection } from './components/BannersSection';
import { CustomersSection } from './components/CustomersSection';
import {
  CategoriesSection,
  ProductsSection,
  ProductCategoryPicker,
  type CategoryFormState,
  type ProductFormState,
} from './components/CatalogSection';
import { OrdersSection, PaymentsSection } from './components/OrdersSection';
import { OverviewSection } from './components/OverviewSection';
import { AdminModal } from './components/Modal';
import { ThemeToggle } from './components/ThemeToggle';
import { imageFieldToString, parseImageField } from './lib/format';

type DashboardSectionKey =
  | 'overview'
  | 'categories'
  | 'products'
  | 'banners'
  | 'customers'
  | 'orders'
  | 'payments'
  | 'banner-editor';

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

const emptyCategory: CategoryFormState = { id: '', name: '', slug: '', imagesText: '' };

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
  content_mode: 'structured',
  content_html: '',
  content_json: [],
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
  if (normalized === 'admin-banners') return 'banners';
  if (normalized.startsWith('admin-banners/')) return 'banner-editor';
  const match = dashboardSections.find((section) => section.id === normalized);
  return match?.key ?? 'overview';
}

function sectionId(section: DashboardSectionKey): string {
  return dashboardSections.find((item) => item.key === section)?.id ?? 'admin-overview';
}

function bannerIdFromHash(hash: string): string {
  const normalized = hash.replace(/^#/, '');
  if (!normalized.startsWith('admin-banners/')) return '';

  const bannerId = normalized.slice('admin-banners/'.length).trim();
  if (!bannerId || bannerId === 'new') return '';
  return bannerId;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function slugifyCategoryName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const [activeModal, setActiveModal] = useState<'category' | 'product' | 'user' | 'order' | 'payment' | null>(null);

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

    const [
      healthResult,
      categoriesResult,
      productsResult,
      bannersResult,
      usersResult,
      ordersResult,
      paymentsResult,
    ] = results;

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
      setBanners([...bannersResult.value.items].sort((left, right) => left.sort_order - right.sort_order));
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
      setBannerEditingId(bannerIdFromHash(window.location.hash));
    };

    syncSection();
    window.addEventListener('hashchange', syncSection);
    return () => window.removeEventListener('hashchange', syncSection);
  }, [session]);

  useEffect(() => {
    if (!session || typeof window === 'undefined') return;
    if (!window.location.hash || (sectionFromHash(window.location.hash) === 'overview' && window.location.hash !== `#${sectionId('overview')}`)) {
      window.location.hash = `#${sectionId('overview')}`;
    }
  }, [session]);

  useEffect(() => {
    if (activeSection !== 'banner-editor') return;

    if (!bannerEditingId) {
      setBannerForm(emptyBanner);
      return;
    }

    const banner = banners.find((item) => item.id === bannerEditingId);
    if (banner) {
      setBannerForm(bannerFormFromBanner(banner));
    }
  }, [activeSection, bannerEditingId, banners]);

  // Close modals on navigation
  useEffect(() => {
    setActiveModal(null);
  }, [activeSection]);

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
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    try {
      const results = await Promise.allSettled(files.map((file) => uploadFile(file)));
      const urls: string[] = [];
      results.forEach((res) => {
        if (res.status === 'fulfilled') {
          urls.push(res.value.file_url);
        } else {
          console.error('Upload failed:', res.reason);
        }
      });

      if (!urls.length) {
        setMessage('Upload failed.');
        return;
      }

      const newImagesText = urls.join('\n');

      if (target === 'category') {
        setCategoryForm((current: CategoryFormState) => ({
          ...current,
          imagesText: current.imagesText ? `${current.imagesText}\n${newImagesText}` : newImagesText,
        }));
      } else if (target === 'product') {
        setProductForm((current: ProductFormState) => ({
          ...current,
          imagesText: current.imagesText ? `${current.imagesText}\n${newImagesText}` : newImagesText,
        }));
      } else if (target === 'banner-background') {
        setBannerForm((current: BannerInput) => ({
          ...current,
          background_value: urls[0] ?? current.background_value ?? '',
        }));
      } else {
        setBannerForm((current: BannerInput) => ({
          ...current,
          media_url: urls[0] ?? current.media_url ?? '',
        }));
      }
      setMessage(`${urls.length} file(s) uploaded.`);
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      event.target.value = '';
    }
  }

  async function handleFileDelete(
    url: string,
    target: 'category' | 'product',
  ) {
    if (!confirm('Delete this image from storage?')) return;

    try {
      await deleteFile(url);
      if (target === 'category') {
        setCategoryForm((current: CategoryFormState) => {
          const images = parseImageField(current.imagesText).filter((u) => u !== url);
          return { ...current, imagesText: imageFieldToString(images) };
        });
      } else {
        setProductForm((current: ProductFormState) => {
          const images = parseImageField(current.imagesText).filter((u) => u !== url);
          return { ...current, imagesText: imageFieldToString(images) };
        });
      }
      setMessage('Image deleted.');
    } catch (error) {
      setMessage(getErrorMessage(error));
    }
  }

  function bannerFormFromBanner(banner: Banner): BannerInput {
    return {
      title: banner.title,
      subtitle: banner.subtitle ?? '',
      description: banner.description ?? '',
      primary_button_label: banner.primary_button_label ?? '',
      primary_button_href: banner.primary_button_href ?? '',
      secondary_button_label: banner.secondary_button_label ?? '',
      secondary_button_href: banner.secondary_button_href ?? '',
      media_url: banner.media_url ?? '',
      media_kind: banner.media_kind === 'video' ? 'video' : 'image',
      content_mode: banner.content_mode === 'html' ? 'html' : 'structured',
      content_html: banner.content_html ?? '',
      content_json: banner.content_json ?? [],
      background_type:
        banner.background_type === 'image' ||
        banner.background_type === 'video' ||
        banner.background_type === 'solid'
          ? banner.background_type
          : 'gradient',
      background_value: banner.background_value ?? '',
      overlay_color: banner.overlay_color ?? '',
      text_color: banner.text_color ?? '',
      sort_order: banner.sort_order,
      is_active: banner.is_active,
    };
  }

  function openBannerEditor(banner: Banner) {
    setBannerEditingId(banner.id);
    setBannerForm(bannerFormFromBanner(banner));
    setActiveSection('banner-editor');
    if (typeof window !== 'undefined') {
      window.location.hash = `#admin-banners/${banner.id}`;
    }
  }

  function createBannerDraft() {
    setBannerEditingId('');
    setBannerForm(emptyBanner);
    setActiveSection('banner-editor');
    if (typeof window !== 'undefined') {
      window.location.hash = '#admin-banners/new';
    }
  }

  function exitBannerEditor() {
    setBannerEditingId('');
    setBannerForm(emptyBanner);
    setActiveSection('banners');
    if (typeof window !== 'undefined') {
      window.location.hash = '#admin-banners';
    }
  }

  async function handleBannerFileAppend(
    event: React.ChangeEvent<HTMLInputElement>,
    target: 'banner' | 'banner-background',
  ) {
    await handleFileAppend(event, target);
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
      setActiveSection('banners');
      if (typeof window !== 'undefined') {
        window.location.hash = `#${sectionId('banners')}`;
      }
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

  async function deleteBannerItem(id: string) {
    try {
      await deleteBanner(id);
      setMessage('Banner deleted.');
      await loadDashboardData();
      if (bannerEditingId === id) {
        exitBannerEditor();
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

  async function submitCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: CategoryInput = {
      name: categoryForm.name,
      slug: categoryForm.slug,
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
      setActiveModal(null);
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
      setActiveModal(null);
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
      setActiveModal(null);
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
      setActiveModal('user');
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
      setActiveModal('order');
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
      setActiveModal('payment');
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
      slug: category.slug,
      imagesText: imageFieldToString(category.images),
    });
    setActiveModal('category');
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
    setActiveModal('product');
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

  if (!session) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} checkingSession={bootstrapping} />;
  }

  const currentSession = session;
  const activeSectionLabel =
    activeSection === 'banner-editor'
      ? 'Banner editor'
      : dashboardSections.find((item) => item.key === activeSection)?.label ?? 'Overview';

  function renderSection() {
    switch (activeSection) {
      case 'banners':
        return (
          <BannersSection
            banners={banners}
            onOpenBanner={(id) => {
              const banner = banners.find((item) => item.id === id);
              if (banner) {
                openBannerEditor(banner);
              }
            }}
            onDeleteBanner={(id) => void deleteBannerItem(id)}
            onAddBanner={createBannerDraft}
          />
        );
      case 'banner-editor':
        return (
          <BannerEditorPage
            key={bannerEditingId || 'new'}
            bannerId={bannerEditingId || null}
            banners={banners}
            onBack={exitBannerEditor}
            onSaved={async () => {
              await loadDashboardData();
            }}
            onRemoved={async () => {
              await loadDashboardData();
              exitBannerEditor();
            }}
            onMessage={setMessage}
          />
        );
      case 'categories':
        return (
          <CategoriesSection
            categories={categories}
            onEditCategory={editCategory}
            onDeleteCategory={(id) => void removeCategory(id)}
            onAddCategory={() => {
              setCategoryForm(emptyCategory);
              setActiveModal('category');
            }}
          />
        );
      case 'products':
        return (
          <ProductsSection
            categories={categories}
            products={products}
            onEditProduct={editProduct}
            onDeleteProduct={(id) => void removeProduct(id)}
            onAddProduct={() => {
              setProductForm(emptyProduct);
              setActiveModal('product');
            }}
          />
        );
      case 'customers':
        return (
          <CustomersSection
            users={users}
            onOpenUser={(id) => void openUser(id)}
            onAddUser={() => {
              setUserForm(emptyUser);
              setActiveModal('user');
            }}
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
    <div className={`admin-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <button
        type="button"
        className="admin-sidebar-backdrop"
        aria-label="Close navigation"
        onClick={() => setSidebarOpen(false)}
      />
      <aside className="admin-sidebar">
        <button
          className="admin-sidebar-close"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        >
          ✕
        </button>
        <div className="admin-sidebar-brand">
          <p className="admin-eyebrow">Tea Time Admin</p>
          <h1>Dashboard</h1>
          <p className="admin-sidebar-copy">{session.admin.email}</p>
        </div>

        <nav className="admin-sidebar-nav" aria-label="Admin sections">
          {dashboardSections.map((item) => (
            <a
              key={item.id}
              className={`admin-sidebar-link${
                activeSection === item.key || (item.key === 'banners' && activeSection === 'banner-editor')
                  ? ' is-active'
                  : ''
              }`}
              href={`#${item.id}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="sidebar-footer-row">
            <span className="admin-badge">
              {health?.database ? 'Database ready' : 'Checking backend'}
            </span>
            <ThemeToggle />
          </div>
          <button type="button" className="admin-logout" onClick={() => void handleLogout()}>
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-content">
        <header className="admin-content-header">
          <div className="header-title-row">
            <button
              className="admin-sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              ☰
            </button>
            <div>
              <p className="admin-eyebrow">Active section</p>
              <h2>{activeSectionLabel}</h2>
            </div>
          </div>
          {message ? <p className="admin-banner-message">{message}</p> : null}
        </header>

        <div className="admin-content-body">{renderSection()}</div>
      </main>

      <AdminModal
        isOpen={activeModal === 'category'}
        onClose={() => setActiveModal(null)}
        title={categoryForm.id ? 'Edit Category' : 'Create Category'}
      >
        <form className="admin-form" onSubmit={submitCategory}>
          <label>
            Name
            <input
              value={categoryForm.name}
              onChange={(e) =>
                setCategoryForm((current) => {
                  const name = e.target.value;
                  return {
                    ...current,
                    name,
                    slug: current.slug ? current.slug : slugifyCategoryName(name),
                  };
                })
              }
              placeholder=""
            />
          </label>
          <label>
            Slug
            <input
              value={categoryForm.slug}
              onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
              placeholder=""
            />
            <small className="helper-copy">Used in /products?category=...</small>
          </label>
          <div>
            <p className="admin-eyebrow" style={{ marginBottom: 8 }}>Images</p>
            <div className="image-grid">
              {parseImageField(categoryForm.imagesText).map((url) => (
                <div key={url} className="image-item">
                  <img src={url} alt="Category" />
                  <button
                    type="button"
                    className="image-delete-btn"
                    onClick={() => void handleFileDelete(url, 'category')}
                    title="Delete image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          <label className="upload-field">
            Add images
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => void handleFileAppend(e, 'category')}
            />
          </label>

          <div className="form-actions">
            <button type="submit">{categoryForm.id ? 'Update category' : 'Create category'}</button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        isOpen={activeModal === 'product'}
        onClose={() => setActiveModal(null)}
        title={productForm.id ? 'Edit Product' : 'Create Product'}
      >
        <form className="admin-form" onSubmit={submitProduct}>
          <label>
            Name
            <input
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              placeholder=""
            />
          </label>
          <label>
            Price
            <input
              type="number"
              min="0"
              step="0.01"
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
            />
          </label>
          <label>
            Description
            <textarea
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
            />
          </label>
          <label>
            Category links
            <ProductCategoryPicker
              categories={categories}
              selectedIds={productForm.categoryIds}
              onChange={(categoryIds) => setProductForm({ ...productForm, categoryIds })}
            />
          </label>
          <div>
            <p className="admin-eyebrow" style={{ marginBottom: 8 }}>Gallery</p>
            <div className="image-grid">
              {parseImageField(productForm.imagesText).map((url) => (
                <div key={url} className="image-item">
                  <img src={url} alt="Product" />
                  <button
                    type="button"
                    className="image-delete-btn"
                    onClick={() => void handleFileDelete(url, 'product')}
                    title="Delete image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          <label className="upload-field">
            Add images
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => void handleFileAppend(e, 'product')}
            />
          </label>

          <div className="form-actions">
            <button type="submit">{productForm.id ? 'Update product' : 'Create product'}</button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        isOpen={activeModal === 'user'}
        onClose={() => setActiveModal(null)}
        title="Customer Account"
      >
        <CustomersSection
          userForm={userForm}
          selectedUser={selectedUser}
          onUserFormChange={(patch) => setUserForm((c: any) => ({ ...c, ...patch }))}
          onSubmitUser={submitUser}
          variant={selectedUser ? 'view' : 'create'}
        />
      </AdminModal>

      <AdminModal
        isOpen={activeModal === 'order'}
        onClose={() => setActiveModal(null)}
        title="Order Details"
      >
        {selectedOrder && (
          <OrdersSection
            selectedOrder={selectedOrder}
            onChangeOrderStatus={changeOrderStatus}
            variant="view"
          />
        )}
      </AdminModal>

      <AdminModal
        isOpen={activeModal === 'payment'}
        onClose={() => setActiveModal(null)}
        title="Payment Details"
      >
        {selectedPayment && (
          <PaymentsSection
            selectedPayment={selectedPayment}
            variant="view"
          />
        )}
      </AdminModal>
    </div>
  );
}
