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
  summary?: DashboardSummary;
}

export interface DashboardSummary {
  products: number;
  categories: number;
  users: number;
  orders: number;
  paid_payments: number;
}

export interface ListResponse<T> {
  ok: boolean;
  items: T[];
}

export interface CategoryListItem {
  id: string;
  name: string;
  images: string[];
  product_count: number;
}

export interface CategoryInput {
  name: string;
  images: string[];
}

export interface ProductListItem {
  id: string;
  name: string;
  images: string[];
  price: number;
  description: string | null;
  category_ids: string[];
  categories: string[];
}

export interface ProductInput {
  name: string;
  images: string[];
  price: number;
  description: string | null;
  category_ids: string[];
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  primary_button_label: string | null;
  primary_button_href: string | null;
  secondary_button_label: string | null;
  secondary_button_href: string | null;
  media_url: string | null;
  media_kind: 'image' | 'video' | string;
  background_type: 'image' | 'video' | 'gradient' | 'solid' | string;
  background_value: string | null;
  overlay_color: string | null;
  text_color: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface BannerInput {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  primary_button_label?: string | null;
  primary_button_href?: string | null;
  secondary_button_label?: string | null;
  secondary_button_href?: string | null;
  media_url?: string | null;
  media_kind: 'image' | 'video';
  background_type: 'image' | 'video' | 'gradient' | 'solid';
  background_value?: string | null;
  overlay_color?: string | null;
  text_color?: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface CustomerProfile {
  id: string;
  user_name: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string;
  avatar_url: string | null;
}

export interface CustomerAuthResponse {
  user: CustomerProfile;
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

export interface UpdateCustomerProfileInput {
  first_name: string;
  last_name: string;
  phone?: string | null;
  avatar_url?: string | null;
}

export interface CustomerListItem {
  id: string;
  user_name: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string;
  avatar_url: string | null;
}

export interface CustomerDetailResponse {
  ok: boolean;
  customer: CustomerAuthResponse;
  addresses: Address[];
  orders: OrderSummary[];
}

export interface CreateCustomerInput {
  user_name: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  email: string;
  password: string;
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

export interface LoginInput {
  email: string;
  password: string;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  line_1: string;
  line_2: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  landmark: string | null;
  is_default: boolean;
}

export interface AddressInput {
  full_name: string;
  phone: string;
  line_1: string;
  line_2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country?: string | null;
  landmark?: string | null;
  is_default: boolean;
}

export interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  images: string[];
  quantity: number;
  unit_price: number;
  line_total: number;
}

export interface CartResponse {
  cart_id: string;
  items: CartItem[];
  total_amount: number;
}

export interface CartItemInput {
  product_id: string;
  quantity: number;
}

export interface CheckoutInput {
  address_id?: string | null;
}

export interface CheckoutResult {
  order_id: string;
  order_number: string;
  total_amount: number;
  currency: string;
}

export interface OrderSummary {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  currency: string;
  placed_on: string;
}

export interface OrderDetail {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  total_amount: number;
  currency: string;
  address: Address;
  items: CartItem[];
}

export interface PaymentRecord {
  id: string;
  order_id: string;
  user_id: string;
  provider: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  status: string;
  amount: number;
  currency: string;
  failure_reason: string | null;
  paid_on: string | null;
}

export interface PaymentEvent {
  id: string;
  provider_event_id: string | null;
  event_type: string;
  payload_json: string;
  created_on: string;
}

export interface PaymentDetailResponse {
  ok: boolean;
  item: PaymentRecord;
  events: PaymentEvent[];
}

export interface InitiatePaymentResponse {
  payment_id: string;
  order_id: string;
  order_number: string;
  amount: number;
  amount_major: number;
  currency: string;
  provider_order_id: string;
  razorpay_key_id: string;
}

export interface VerifyPaymentInput {
  provider_order_id: string;
  provider_payment_id: string;
  provider_signature: string;
}

export interface UploadResponse {
  file_url: string;
}
