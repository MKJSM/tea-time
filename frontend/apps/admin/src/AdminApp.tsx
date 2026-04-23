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
  loginAdmin,
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
  LoginInput,
  OrderDetail,
  OrderSummary,
  PaymentDetailResponse,
  PaymentRecord,
  ProductInput,
  ProductListItem,
  CustomerListItem,
} from '@tea-time/types';

import { BannersSection, CustomersSection } from './components/BannersSection';
import { CatalogSection } from './components/CatalogSection';
import type { CategoryFormState, ProductFormState } from './components/CatalogSection';
import { OrdersSection, PaymentsSection } from './components/OrdersSection';
import { OverviewSection } from './components/OverviewSection';
import { imageFieldToString, parseImageField } from './lib/format';

const defaultLogin: LoginInput = {
  email: 'admin@tea-time.local',
  password: 'TeaTimeAdmin123!',
};

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
  primary_button_href: '#catalog',
  secondary_button_label: '',
  secondary_button_href: '#account',
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

const adminSectionAnchors = [
  { id: 'admin-overview', label: 'Overview' },
  { id: 'admin-catalog', label: 'Catalog' },
  { id: 'admin-banners', label: 'Banners' },
  { id: 'admin-customers', label: 'Customers' },
  { id: 'admin-orders', label: 'Orders' },
  { id: 'admin-payments', label: 'Payments' },
] as const;

export function AdminApp() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [session, setSession] = useState<AdminAuthResponse | null>(null);
  const [loginForm, setLoginForm] = useState<LoginInput>(defaultLogin);
  const [message, setMessage] = useState<string>('');

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
  const [bannerEditingId, setBannerEditingId] = useState<string>('');
  const [userForm, setUserForm] = useState<CreateCustomerInput>(emptyUser);

  useEffect(() => {
    void loadPublicAdmin();
    void restoreSession();
  }, []);

  async function loadPublicAdmin() {
    try {
      const response = await getAdminHealth();
      setHealth(response);
      setSummary(response.summary ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load admin status');
    }
  }

  async function loadAdminData() {
    try {
      const [catRes, prodRes, bannerRes, userRes, orderRes, paymentRes] = await Promise.all([
        getCategories('admin'),
        getProducts('admin'),
        getBanners('admin'),
        getUsers(),
        getOrders('admin'),
        getPayments(),
      ]);
      setCategories(catRes.items);
      setProducts(prodRes.items);
      setBanners(bannerRes.items);
      setUsers(userRes.items);
      setOrders(orderRes.items);
      setPayments(paymentRes.items);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load admin data');
    }
  }

  async function restoreSession() {
    try {
      const response = await getCurrentAdmin();
      setSession(response);
      await loadAdminData();
    } catch {
      setSession(null);
    }
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await loginAdmin(loginForm);
      setSession(response);
      setMessage(`Logged in as ${response.admin.email}`);
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Admin login failed');
    }
  }

  async function handleLogout() {
    try {
      await logoutAdmin();
      setSession(null);
      setMessage('Admin session closed.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Admin logout failed');
    }
  }

  async function handleFileAppend(
    event: React.ChangeEvent<HTMLInputElement>,
    target: 'category' | 'product' | 'banner',
  ) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const response = await uploadFile(file);
      if (target === 'category') {
        setCategoryForm((c) => ({
          ...c,
          imagesText: c.imagesText ? `${c.imagesText}\n${response.file_url}` : response.file_url,
        }));
      } else if (target === 'product') {
        setProductForm((c) => ({
          ...c,
          imagesText: c.imagesText ? `${c.imagesText}\n${response.file_url}` : response.file_url,
        }));
      } else {
        setBannerForm((c) => ({ ...c, media_url: response.file_url }));
      }
      setMessage('File uploaded to S3.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Upload failed');
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
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Category save failed');
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
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Product save failed');
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
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Banner save failed');
    }
  }

  async function submitUser(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await createUser({ ...userForm, phone: userForm.phone || null });
      setUserForm(emptyUser);
      setMessage('Customer account created from admin.');
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Customer creation failed');
    }
  }

  async function openUser(id: string) {
    try {
      setSelectedUser(await getUser(id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load customer');
    }
  }

  async function openOrder(id: string) {
    try {
      setSelectedOrder(await getOrder(id, 'admin'));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load order');
    }
  }

  async function changeOrderStatus(id: string, status: string) {
    try {
      await updateOrderStatus(id, status);
      setMessage(`Order status updated to ${status}.`);
      await loadAdminData();
      if (selectedOrder?.id === id) await openOrder(id);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update order status');
    }
  }

  async function openPayment(id: string) {
    try {
      setSelectedPayment(await getPayment(id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load payment');
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
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete category');
    }
  }

  async function removeProduct(id: string) {
    try {
      await deleteProduct(id);
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete product');
    }
  }

  async function removeBanner(id: string) {
    try {
      await deleteBanner(id);
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to delete banner');
    }
  }

  return (
    <main className="admin-shell">
      <header className="admin-topbar">
        <div>
          <p className="admin-eyebrow">Tea Time Admin</p>
          <h1>
            Manage banners, catalog, customers, orders, and payments from one control surface.
          </h1>
        </div>
        <div className="admin-topbar-actions">
          <span className="admin-badge">
            {health?.database ? 'Database ready' : 'Checking backend'}
          </span>
        </div>
      </header>

      <nav className="admin-nav" aria-label="Admin sections">
        {adminSectionAnchors.map((item) => (
          <a key={item.id} href={`#${item.id}`}>
            {item.label}
          </a>
        ))}
      </nav>

      <OverviewSection
        health={health}
        summary={summary}
        session={session}
        loginForm={loginForm}
        message={message}
        onLoginFormChange={(patch) => setLoginForm((c) => ({ ...c, ...patch }))}
        onLogin={(e) => void handleLogin(e)}
        onLogout={() => void handleLogout()}
      />

      <CatalogSection
        categories={categories}
        products={products}
        categoryForm={categoryForm}
        productForm={productForm}
        onCategoryFormChange={(patch) => setCategoryForm((c) => ({ ...c, ...patch }))}
        onProductFormChange={(patch) => setProductForm((c) => ({ ...c, ...patch }))}
        onSubmitCategory={(e) => void submitCategory(e)}
        onSubmitProduct={(e) => void submitProduct(e)}
        onEditCategory={editCategory}
        onEditProduct={editProduct}
        onDeleteCategory={(id) => void removeCategory(id)}
        onDeleteProduct={(id) => void removeProduct(id)}
        onFileAppend={(e, target) => void handleFileAppend(e, target)}
      />

      <section className="admin-grid" id="admin-banners">
        <BannersSection
          banners={banners}
          bannerForm={bannerForm}
          bannerEditingId={bannerEditingId}
          onBannerFormChange={(patch) => setBannerForm((c) => ({ ...c, ...patch }))}
          onSubmitBanner={(e) => void submitBanner(e)}
          onEditBanner={editBanner}
          onDeleteBanner={(id) => void removeBanner(id)}
          onFileAppend={(e, target) => void handleFileAppend(e, target)}
        />

        <CustomersSection
          users={users}
          userForm={userForm}
          selectedUser={selectedUser}
          onUserFormChange={(patch) => setUserForm((c) => ({ ...c, ...patch }))}
          onSubmitUser={(e) => void submitUser(e)}
          onOpenUser={(id) => void openUser(id)}
        />
      </section>

      <section className="admin-grid" id="admin-orders">
        <OrdersSection
          orders={orders}
          selectedOrder={selectedOrder}
          onChangeOrderStatus={(id, status) => void changeOrderStatus(id, status)}
          onOpenOrder={(id) => void openOrder(id)}
        />

        <PaymentsSection
          payments={payments}
          selectedPayment={selectedPayment}
          onOpenPayment={(id) => void openPayment(id)}
        />
      </section>
    </main>
  );
}
