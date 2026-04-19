export interface AppCardData {
  eyebrow: string;
  title: string;
  description: string;
}

export interface HealthResponse {
  ok: boolean;
  scope: string;
  database?: boolean;
  service?: string;
}

export interface CategoryListItem {
  id: string;
  name: string;
  images: string[];
  product_count: number;
}

export interface ProductListItem {
  id: string;
  name: string;
  images: string[];
  price: number;
  description: string | null;
  categories: string[];
}

export interface ListResponse<T> {
  ok: boolean;
  items: T[];
}

export interface CustomerProfile {
  id: string;
  user_name: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string;
}

export interface CustomerAuthResponse {
  user: CustomerProfile;
  session_cookie: string;
}

export interface AdminProfile {
  id: string;
  user_name: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string;
}

export interface AdminAuthResponse {
  admin: AdminProfile;
  session_cookie: string;
}

export interface CustomerRegisterInput {
  user_name: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
