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
  Address,
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

const defaultLogin: LoginInput = {
  email: 'admin@tea-time.local',
  password: 'TeaTimeAdmin123!',
};

const emptyCategory: CategoryInput = {
  name: '',
  images: [],
};

const emptyProduct: ProductInput = {
  name: '',
  images: [],
  price: 0,
  description: '',
  category_ids: [],
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
  background_type: 'gradient',
  background_value: 'linear-gradient(135deg, #375c36 0%, #7d8f49 42%, #283b24 100%)',
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

function formatMoney(value: number, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Not available';
  }
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

function imageFieldToString(images: string[]) {
  return images.join('\n');
}

function parseImageField(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

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

  const [categoryForm, setCategoryForm] = useState({ id: '', name: '', imagesText: '' });
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    imagesText: '',
    price: '0',
    description: '',
    categoryIds: [] as string[],
  });
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
      const [categoryResponse, productResponse, bannerResponse, userResponse, orderResponse, paymentResponse] =
        await Promise.all([
          getCategories('admin'),
          getProducts('admin'),
          getBanners('admin'),
          getUsers(),
          getOrders('admin'),
          getPayments(),
        ]);

      setCategories(categoryResponse.items);
      setProducts(productResponse.items);
      setBanners(bannerResponse.items);
      setUsers(userResponse.items);
      setOrders(orderResponse.items);
      setPayments(paymentResponse.items);
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
    if (!file) {
      return;
    }

    try {
      const response = await uploadFile(file);
      if (target === 'category') {
        setCategoryForm((current) => ({
          ...current,
          imagesText: current.imagesText ? `${current.imagesText}\n${response.file_url}` : response.file_url,
        }));
      } else if (target === 'product') {
        setProductForm((current) => ({
          ...current,
          imagesText: current.imagesText ? `${current.imagesText}\n${response.file_url}` : response.file_url,
        }));
      } else {
        setBannerForm((current) => ({ ...current, media_url: response.file_url }));
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
      setCategoryForm({ id: '', name: '', imagesText: '' });
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
      setProductForm({ id: '', name: '', imagesText: '', price: '0', description: '', categoryIds: [] });
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
      await createUser({
        ...userForm,
        phone: userForm.phone || null,
      });
      setUserForm(emptyUser);
      setMessage('Customer account created from admin.');
      await loadAdminData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Customer creation failed');
    }
  }

  async function openUser(id: string) {
    try {
      const response = await getUser(id);
      setSelectedUser(response);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load customer');
    }
  }

  async function openOrder(id: string) {
    try {
      const response = await getOrder(id, 'admin');
      setSelectedOrder(response);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load order');
    }
  }

  async function changeOrderStatus(id: string, status: string) {
    try {
      await updateOrderStatus(id, status);
      setMessage(`Order status updated to ${status}.`);
      await loadAdminData();
      if (selectedOrder?.id === id) {
        await openOrder(id);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update order status');
    }
  }

  async function openPayment(id: string) {
    try {
      const response = await getPayment(id);
      setSelectedPayment(response);
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
          <h1>Manage banners, catalog, customers, orders, and payments from one control surface.</h1>
        </div>
        <div className="admin-topbar-actions">
          <span className="admin-badge">{health?.database ? 'Database ready' : 'Checking backend'}</span>
          {session ? (
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          ) : null}
        </div>
      </header>

      <nav className="admin-nav" aria-label="Admin sections">
        {adminSectionAnchors.map((item) => (
          <a key={item.id} href={`#${item.id}`}>
            {item.label}
          </a>
        ))}
      </nav>

      <section className="admin-summary-grid" id="admin-overview">
        <article className="admin-card admin-login-card">
          <h2>Admin session</h2>
          {session ? (
            <>
              <strong>{session.admin.email}</strong>
              <p className="admin-copy">Use the panels below to keep the customer and admin flows fully populated.</p>
            </>
          ) : (
            <form className="admin-form" onSubmit={handleLogin}>
              <label>
                Email
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                />
              </label>
              <label>
                Password
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                />
              </label>
              <button type="submit">Login</button>
            </form>
          )}
          {message ? <p className="admin-message">{message}</p> : null}
        </article>

        {(summary
          ? [
              ['Products', summary.products],
              ['Categories', summary.categories],
              ['Users', summary.users],
              ['Orders', summary.orders],
              ['Paid payments', summary.paid_payments],
            ]
          : []
        ).map(([label, value]) => (
          <article key={label} className="admin-card metric-card">
            <span>{label}</span>
            <strong>{String(value)}</strong>
          </article>
        ))}
      </section>

      <section className="admin-grid" id="admin-catalog">
        <article className="admin-card">
          <h2>Categories</h2>
          <form className="admin-form" onSubmit={submitCategory}>
            <label>
              Name
              <input
                value={categoryForm.name}
                onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label>
              Image URLs
              <textarea
                value={categoryForm.imagesText}
                onChange={(event) =>
                  setCategoryForm((current) => ({ ...current, imagesText: event.target.value }))
                }
              />
            </label>
            <label className="upload-field">
              Upload image
              <input type="file" accept="image/*" onChange={(event) => void handleFileAppend(event, 'category')} />
            </label>
            <button type="submit">{categoryForm.id ? 'Update category' : 'Create category'}</button>
          </form>

          <div className="admin-list">
            {categories.map((category) => (
              <article key={category.id} className="admin-list-item">
                <div>
                  <strong>{category.name}</strong>
                  <span>{category.product_count} products</span>
                </div>
                <div className="row-actions">
                  <button type="button" onClick={() => editCategory(category)}>
                    Edit
                  </button>
                  <button type="button" className="danger" onClick={() => void removeCategory(category.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="admin-card">
          <h2>Products</h2>
          <form className="admin-form" onSubmit={submitProduct}>
            <label>
              Name
              <input
                value={productForm.name}
                onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label>
              Price
              <input
                type="number"
                min="0"
                step="0.01"
                value={productForm.price}
                onChange={(event) => setProductForm((current) => ({ ...current, price: event.target.value }))}
              />
            </label>
            <label>
              Description
              <textarea
                value={productForm.description}
                onChange={(event) =>
                  setProductForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </label>
            <label>
              Category links
              <select
                multiple
                value={productForm.categoryIds}
                onChange={(event) =>
                  setProductForm((current) => ({
                    ...current,
                    categoryIds: Array.from(event.target.selectedOptions, (option) => option.value),
                  }))
                }
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Image URLs
              <textarea
                value={productForm.imagesText}
                onChange={(event) =>
                  setProductForm((current) => ({ ...current, imagesText: event.target.value }))
                }
              />
            </label>
            <label className="upload-field">
              Upload image
              <input type="file" accept="image/*" onChange={(event) => void handleFileAppend(event, 'product')} />
            </label>
            <button type="submit">{productForm.id ? 'Update product' : 'Create product'}</button>
          </form>

          <div className="admin-list">
            {products.map((product) => (
              <article key={product.id} className="admin-list-item">
                <div>
                  <strong>{product.name}</strong>
                  <span>{formatMoney(product.price)} · {product.categories.join(', ') || 'Unassigned'}</span>
                </div>
                <div className="row-actions">
                  <button type="button" onClick={() => editProduct(product)}>
                    Edit
                  </button>
                  <button type="button" className="danger" onClick={() => void removeProduct(product.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      <section className="admin-grid" id="admin-banners">
        <article className="admin-card">
          <h2>Banners</h2>
          <form className="admin-form" onSubmit={submitBanner}>
            <label>
              Title
              <input value={bannerForm.title} onChange={(event) => setBannerForm((current) => ({ ...current, title: event.target.value }))} />
            </label>
            <label>
              Subtitle
              <input
                value={bannerForm.subtitle ?? ''}
                onChange={(event) => setBannerForm((current) => ({ ...current, subtitle: event.target.value }))}
              />
            </label>
            <label>
              Description
              <textarea
                value={bannerForm.description ?? ''}
                onChange={(event) =>
                  setBannerForm((current) => ({ ...current, description: event.target.value }))
                }
              />
            </label>
            <label>
              Media URL
              <input
                value={bannerForm.media_url ?? ''}
                onChange={(event) => setBannerForm((current) => ({ ...current, media_url: event.target.value }))}
              />
            </label>
            <label className="upload-field">
              Upload media
              <input
                type="file"
                accept="image/*,video/mp4"
                onChange={(event) => void handleFileAppend(event, 'banner')}
              />
            </label>
            <label>
              Background value
              <input
                value={bannerForm.background_value ?? ''}
                onChange={(event) =>
                  setBannerForm((current) => ({ ...current, background_value: event.target.value }))
                }
              />
            </label>
            <div className="split-inputs">
              <label>
                Media kind
                <select
                  value={bannerForm.media_kind}
                  onChange={(event) =>
                    setBannerForm((current) => ({
                      ...current,
                      media_kind: event.target.value as BannerInput['media_kind'],
                    }))
                  }
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </label>
              <label>
                Background type
                <select
                  value={bannerForm.background_type}
                  onChange={(event) =>
                    setBannerForm((current) => ({
                      ...current,
                      background_type: event.target.value as BannerInput['background_type'],
                    }))
                  }
                >
                  <option value="gradient">Gradient</option>
                  <option value="solid">Solid</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </label>
            </div>
            <div className="split-inputs">
              <label>
                Sort order
                <input
                  type="number"
                  value={bannerForm.sort_order}
                  onChange={(event) =>
                    setBannerForm((current) => ({ ...current, sort_order: Number(event.target.value) }))
                  }
                />
              </label>
              <label>
                Text color
                <input
                  value={bannerForm.text_color ?? ''}
                  onChange={(event) => setBannerForm((current) => ({ ...current, text_color: event.target.value }))}
                />
              </label>
            </div>
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={bannerForm.is_active}
                onChange={(event) => setBannerForm((current) => ({ ...current, is_active: event.target.checked }))}
              />
              Banner active on landing page
            </label>
            <button type="submit">{bannerEditingId ? 'Update banner' : 'Create banner'}</button>
          </form>

          <div className="admin-list">
            {banners.map((banner) => (
              <article key={banner.id} className="admin-list-item">
                <div>
                  <strong>{banner.title}</strong>
                  <span>
                    #{banner.sort_order} · {banner.is_active ? 'Active' : 'Hidden'}
                  </span>
                </div>
                <div className="row-actions">
                  <button type="button" onClick={() => editBanner(banner)}>
                    Edit
                  </button>
                  <button type="button" className="danger" onClick={() => void removeBanner(banner.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </article>

        <article className="admin-card" id="admin-customers">
          <h2>Customers</h2>
          <form className="admin-form" onSubmit={submitUser}>
            <label>
              Username
              <input value={userForm.user_name} onChange={(event) => setUserForm((current) => ({ ...current, user_name: event.target.value }))} />
            </label>
            <div className="split-inputs">
              <label>
                First name
                <input
                  value={userForm.first_name}
                  onChange={(event) => setUserForm((current) => ({ ...current, first_name: event.target.value }))}
                />
              </label>
              <label>
                Last name
                <input
                  value={userForm.last_name}
                  onChange={(event) => setUserForm((current) => ({ ...current, last_name: event.target.value }))}
                />
              </label>
            </div>
            <label>
              Phone
              <input value={userForm.phone ?? ''} onChange={(event) => setUserForm((current) => ({ ...current, phone: event.target.value }))} />
            </label>
            <label>
              Email
              <input type="email" value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label>
              Password
              <input
                type="password"
                value={userForm.password}
                onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))}
              />
            </label>
            <button type="submit">Create customer</button>
          </form>

          <div className="admin-list">
            {users.map((user) => (
              <article key={user.id} className="admin-list-item">
                <div>
                  <strong>
                    {user.first_name} {user.last_name}
                  </strong>
                  <span>{user.email}</span>
                </div>
                <button type="button" onClick={() => void openUser(user.id)}>
                  View
                </button>
              </article>
            ))}
          </div>

          {selectedUser ? (
            <article className="detail-panel">
              <h3>
                {selectedUser.customer.user.first_name} {selectedUser.customer.user.last_name}
              </h3>
              <p>{selectedUser.customer.user.email}</p>
              <p>{selectedUser.addresses.length} addresses · {selectedUser.orders.length} orders</p>
              {selectedUser.addresses.map((address: Address) => (
                <div key={address.id} className="detail-row">
                  <span>{address.full_name}</span>
                  <span>{address.city}</span>
                </div>
              ))}
            </article>
          ) : null}
        </article>
      </section>

      <section className="admin-grid" id="admin-orders">
        <article className="admin-card">
          <h2>Orders</h2>
          <div className="admin-list">
            {orders.map((order) => (
              <article key={order.id} className="admin-list-item">
                <div>
                  <strong>{order.order_number}</strong>
                  <span>
                    {formatMoney(order.total_amount, order.currency)} · {order.payment_status}
                  </span>
                </div>
                <div className="row-actions">
                  <select onChange={(event) => void changeOrderStatus(order.id, event.target.value)} value={order.status}>
                    <option value="placed">Placed</option>
                    <option value="paid">Paid</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="completed">Completed</option>
                  </select>
                  <button type="button" onClick={() => void openOrder(order.id)}>
                    View
                  </button>
                </div>
              </article>
            ))}
          </div>

          {selectedOrder ? (
            <article className="detail-panel">
              <h3>{selectedOrder.order_number}</h3>
              <p>
                {selectedOrder.status} · {selectedOrder.payment_status}
              </p>
              {selectedOrder.items.map((item) => (
                <div key={item.id} className="detail-row">
                  <span>
                    {item.product_name} x {item.quantity}
                  </span>
                  <strong>{formatMoney(item.line_total, selectedOrder.currency)}</strong>
                </div>
              ))}
            </article>
          ) : null}
        </article>

        <article className="admin-card" id="admin-payments">
          <h2>Payments</h2>
          <div className="admin-list">
            {payments.map((payment) => (
              <article key={payment.id} className="admin-list-item">
                <div>
                  <strong>{payment.provider_payment_id ?? payment.provider_order_id ?? payment.id}</strong>
                  <span>
                    {formatMoney(payment.amount, payment.currency)} · {payment.status}
                  </span>
                </div>
                <button type="button" onClick={() => void openPayment(payment.id)}>
                  Watch
                </button>
              </article>
            ))}
          </div>

          {selectedPayment ? (
            <article className="detail-panel">
              <h3>{selectedPayment.item.provider}</h3>
              <p>
                {selectedPayment.item.status} · Paid on {formatDate(selectedPayment.item.paid_on)}
              </p>
              {selectedPayment.events.map((event) => (
                <div key={event.id} className="detail-event">
                  <strong>{event.event_type}</strong>
                  <span>{formatDate(event.created_on)}</span>
                  <code>{event.payload_json.slice(0, 180)}</code>
                </div>
              ))}
            </article>
          ) : null}
        </article>
      </section>
    </main>
  );
}
