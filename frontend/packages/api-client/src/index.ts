import type {
  Address,
  AddressInput,
  AdminAuthResponse,
  Banner,
  BannerInput,
  CartItemInput,
  CartResponse,
  CategoryInput,
  CategoryListItem,
  CheckoutInput,
  CheckoutResult,
  CreateCustomerInput,
  CustomerAuthResponse,
  CustomerDetailResponse,
  CustomerListItem,
  CustomerRegisterInput,
  HealthResponse,
  InitiatePaymentResponse,
  ListResponse,
  LoginInput,
  OrderDetail,
  OrderSummary,
  PaymentDetailResponse,
  PaymentRecord,
  ProductInput,
  ProductListItem,
  UpdateCustomerProfileInput,
  UploadResponse,
  VerifyPaymentInput,
} from '@tea-time/types';

const API_BASE = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE) || '';

export function apiBase(scope: 'customer' | 'admin'): string {
  return scope === 'admin' ? `${API_BASE}/api/admin` : `${API_BASE}/api`;
}


type RequestBody = any;

async function requestJson<T>(path: string, init?: Omit<RequestInit, 'body'> & { body?: RequestBody }): Promise<T> {
  const headers = new Headers(init?.headers);
  let body: BodyInit | undefined;

  if (init?.body instanceof FormData || typeof init?.body === 'string' || init?.body instanceof URLSearchParams) {
    body = init.body;
  } else if (init?.body) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(init.body);
  }

  const { body: _, ...restInit } = init || {};
  const response = await fetch(path, {
    credentials: 'include',
    ...restInit,
    headers,
    body,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getCustomerHealth() {
  return requestJson<HealthResponse>(`${apiBase('customer')}/health`);
}

export function getAdminHealth() {
  return requestJson<HealthResponse>(`${apiBase('admin')}/health`);
}

export function getCategories(scope: 'customer' | 'admin' = 'customer') {
  return requestJson<ListResponse<CategoryListItem>>(`${apiBase(scope)}/categories`);
}

export function createCategory(input: CategoryInput) {
  return requestJson<CategoryListItem>(`${apiBase('admin')}/categories`, {
    method: 'POST',
    body: input,
  });
}

export function updateCategory(id: string, input: CategoryInput) {
  return requestJson<CategoryListItem>(`${apiBase('admin')}/categories/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteCategory(id: string) {
  return requestJson<{ ok: boolean }>(`${apiBase('admin')}/categories/${id}`, {
    method: 'DELETE',
  });
}

export function getProducts(scope: 'customer' | 'admin' = 'customer', categoryId?: string) {
  const search = new URLSearchParams();
  if (categoryId) {
    search.set('category_id', categoryId);
  }
  const suffix = search.toString() ? `?${search.toString()}` : '';
  return requestJson<ListResponse<ProductListItem>>(`${apiBase(scope)}/products${suffix}`);
}

export function getProduct(id: string, scope: 'customer' | 'admin' = 'customer') {
  return requestJson<ProductListItem>(`${apiBase(scope)}/products/${id}`);
}

export function createProduct(input: ProductInput) {
  return requestJson<ProductListItem>(`${apiBase('admin')}/products`, {
    method: 'POST',
    body: input,
  });
}

export function updateProduct(id: string, input: ProductInput) {
  return requestJson<ProductListItem>(`${apiBase('admin')}/products/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteProduct(id: string) {
  return requestJson<{ ok: boolean }>(`${apiBase('admin')}/products/${id}`, {
    method: 'DELETE',
  });
}

export function getBanners(scope: 'customer' | 'admin' = 'customer') {
  return requestJson<ListResponse<Banner>>(`${apiBase(scope)}/banners`);
}

export function createBanner(input: BannerInput) {
  return requestJson<Banner>(`${apiBase('admin')}/banners`, {
    method: 'POST',
    body: input,
  });
}

export function updateBanner(id: string, input: BannerInput) {
  return requestJson<Banner>(`${apiBase('admin')}/banners/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteBanner(id: string) {
  return requestJson<{ ok: boolean }>(`${apiBase('admin')}/banners/${id}`, {
    method: 'DELETE',
  });
}

export function registerCustomer(input: CustomerRegisterInput) {
  return requestJson<CustomerAuthResponse>(`${apiBase('customer')}/auth/register`, {
    method: 'POST',
    body: input,
  });
}

export function loginCustomer(input: LoginInput) {
  return requestJson<CustomerAuthResponse>(`${apiBase('customer')}/auth/login`, {
    method: 'POST',
    body: input,
  });
}

export function getCurrentCustomer() {
  return requestJson<CustomerAuthResponse>(`${apiBase('customer')}/auth/me`);
}

export function updateCurrentCustomer(input: UpdateCustomerProfileInput) {
  return requestJson<CustomerAuthResponse>(`${apiBase('customer')}/customer/profile`, {
    method: 'PATCH',
    body: input,
  });
}

export function logoutCustomer() {
  return requestJson<{ ok: boolean; logged_out: boolean; scope: string }>(
    `${apiBase('customer')}/auth/logout`,
    { method: 'POST' },
  );
}

export function loginAdmin(input: LoginInput) {
  return requestJson<AdminAuthResponse>(`${apiBase('admin')}/auth/login`, {
    method: 'POST',
    body: input,
  });
}

export function getCurrentAdmin() {
  return requestJson<AdminAuthResponse>(`${apiBase('admin')}/auth/me`);
}

export function logoutAdmin() {
  return requestJson<{ ok: boolean; logged_out: boolean; scope: string }>(
    `${apiBase('admin')}/auth/logout`,
    { method: 'POST' },
  );
}

export function getAddresses() {
  return requestJson<ListResponse<Address>>(`${apiBase('customer')}/addresses`);
}

export function createAddress(input: AddressInput) {
  return requestJson<Address>(`${apiBase('customer')}/addresses`, {
    method: 'POST',
    body: input,
  });
}

export function updateAddress(id: string, input: AddressInput) {
  return requestJson<Address>(`${apiBase('customer')}/addresses/${id}`, {
    method: 'PATCH',
    body: input,
  });
}

export function deleteAddress(id: string) {
  return requestJson<{ ok: boolean }>(`${apiBase('customer')}/addresses/${id}`, {
    method: 'DELETE',
  });
}

export function getCart() {
  return requestJson<CartResponse>(`${apiBase('customer')}/cart`);
}

export function addCartItem(input: CartItemInput) {
  return requestJson<CartResponse>(`${apiBase('customer')}/cart/items`, {
    method: 'POST',
    body: input,
  });
}

export function updateCartItem(id: string, quantity: number) {
  return requestJson<CartResponse>(`${apiBase('customer')}/cart/items/${id}`, {
    method: 'PATCH',
    body: { quantity },
  });
}

export function deleteCartItem(id: string) {
  return requestJson<CartResponse>(`${apiBase('customer')}/cart/items/${id}`, {
    method: 'DELETE',
  });
}

export function checkout(input: CheckoutInput) {
  return requestJson<CheckoutResult>(`${apiBase('customer')}/orders/checkout`, {
    method: 'POST',
    body: input,
  });
}

export function getOrders(scope: 'customer' | 'admin' = 'customer') {
  return requestJson<ListResponse<OrderSummary>>(`${apiBase(scope)}/orders`);
}

export function getOrder(id: string, scope: 'customer' | 'admin' = 'customer') {
  return requestJson<OrderDetail>(`${apiBase(scope)}/orders/${id}`);
}

export function updateOrderStatus(id: string, status: string) {
  return requestJson<{ ok: boolean }>(`${apiBase('admin')}/orders/${id}/status`, {
    method: 'PATCH',
    body: { status },
  });
}

export function initiateRazorpayOrder(orderId: string) {
  return requestJson<InitiatePaymentResponse>(`${apiBase('customer')}/payments/razorpay/order`, {
    method: 'POST',
    body: { order_id: orderId },
  });
}

export function verifyPayment(input: VerifyPaymentInput) {
  return requestJson<PaymentRecord>(`${apiBase('customer')}/payments/razorpay/verify`, {
    method: 'POST',
    body: input,
  });
}

export function getPayments() {
  return requestJson<ListResponse<PaymentRecord>>(`${apiBase('admin')}/payments`);
}

export function getPayment(id: string) {
  return requestJson<PaymentDetailResponse>(`${apiBase('admin')}/payments/${id}`);
}

export function getUsers() {
  return requestJson<ListResponse<CustomerListItem>>(`${apiBase('admin')}/users`);
}

export function createUser(input: CreateCustomerInput) {
  return requestJson<CustomerAuthResponse>(`${apiBase('admin')}/users`, {
    method: 'POST',
    body: input,
  });
}

export function getUser(id: string) {
  return requestJson<CustomerDetailResponse>(`${apiBase('admin')}/users/${id}`);
}

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestJson<UploadResponse>(`${apiBase('customer')}/files/upload`, {
    method: 'POST',
    body: formData,
  });
}
