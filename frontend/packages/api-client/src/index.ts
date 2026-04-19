import type {
  AdminAuthResponse,
  CategoryListItem,
  CustomerAuthResponse,
  CustomerRegisterInput,
  HealthResponse,
  ListResponse,
  LoginInput,
  ProductListItem,
} from '@tea-time/types';

export function apiBase(scope: 'customer' | 'admin'): string {
  return scope === 'admin' ? '/api/admin' : '/api';
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
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
  const root = apiBase(scope);
  const path = scope === 'admin' ? `${root}/categories` : `${root}/categories`;
  return requestJson<ListResponse<CategoryListItem>>(path);
}

export function getProducts(scope: 'customer' | 'admin' = 'customer') {
  const root = apiBase(scope);
  const path = scope === 'admin' ? `${root}/products` : `${root}/products`;
  return requestJson<ListResponse<ProductListItem>>(path);
}

export function registerCustomer(input: CustomerRegisterInput) {
  return requestJson<CustomerAuthResponse>(`${apiBase('customer')}/auth/register`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function loginCustomer(input: LoginInput) {
  return requestJson<CustomerAuthResponse>(`${apiBase('customer')}/auth/login`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getCurrentCustomer() {
  return requestJson<CustomerAuthResponse>(`${apiBase('customer')}/auth/me`);
}

export function logoutCustomer() {
  return requestJson<{ ok: boolean; logged_out: boolean; scope: string }>(
    `${apiBase('customer')}/auth/logout`,
    {
      method: 'POST',
    },
  );
}

export function loginAdmin(input: LoginInput) {
  return requestJson<AdminAuthResponse>(`${apiBase('admin')}/auth/login`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function getCurrentAdmin() {
  return requestJson<AdminAuthResponse>(`${apiBase('admin')}/auth/me`);
}

export function logoutAdmin() {
  return requestJson<{ ok: boolean; logged_out: boolean; scope: string }>(
    `${apiBase('admin')}/auth/logout`,
    {
      method: 'POST',
    },
  );
}
