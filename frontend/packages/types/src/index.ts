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
  slug: string;
  images: string[];
  product_count: number;
}

export interface CategoryInput {
  name: string;
  slug: string;
  images: string[];
}

export interface ProductListItem {
  id: string;
  name: string;
  images: string[];
  price: number;
  description: string | null;
  rating: number;
  origin: string | null;
  caffeine: string | null;
  format: string | null;
  tags: string[];
  flavor_profile: string[];
  category_ids: string[];
  categories: string[];
}

export interface ProductCustomizationOption {
  id: string;
  name: string;
  description: string | null;
  price_delta: number;
  sort_order: number;
}

export interface ProductCustomizationGroup {
  id: string;
  name: string;
  description: string | null;
  min_select: number;
  max_select: number;
  sort_order: number;
  options: ProductCustomizationOption[];
}

export interface ProductCustomizationGroupInput {
  name: string;
  description: string | null;
  min_select: number;
  max_select: number;
  sort_order: number;
  options: ProductCustomizationOptionInput[];
}

export interface ProductCustomizationOptionInput {
  name: string;
  description: string | null;
  price_delta: number;
  sort_order: number;
}

export interface ProductDetail {
  id: string;
  name: string;
  images: string[];
  price: number;
  description: string | null;
  rating: number;
  origin: string | null;
  caffeine: string | null;
  format: string | null;
  story: string | null;
  tags: string[];
  flavor_profile: string[];
  brewing_guide: string[];
  category_ids: string[];
  categories: string[];
  customization_groups: ProductCustomizationGroup[];
}

export interface ProductInput {
  name: string;
  images: string[];
  price: number;
  description: string | null;
  rating: number;
  origin: string | null;
  caffeine: string | null;
  format: string | null;
  story: string | null;
  tags: string[];
  flavor_profile: string[];
  brewing_guide: string[];
  category_ids: string[];
  customization_groups: ProductCustomizationGroupInput[];
}

export type BannerMediaKind = 'image' | 'video' | string;
export type BannerContentMode = 'structured' | 'html' | string;
export type BannerBackgroundType = 'image' | 'video' | 'gradient' | 'solid' | string;

export type BannerContentBlock =
  | {
      id: string;
      type: 'heading';
      content: string;
    }
  | {
      id: string;
      type: 'paragraph';
      content: string;
    }
  | {
      id: string;
      type: 'image';
      content: {
        src: string;
        alt: string;
      };
    }
  | {
      id: string;
      type: 'button';
      content: {
        label: string;
        href: string;
      };
    }
  | {
      id: string;
      type: 'spacer';
      content: string;
    }
  | {
      id: string;
      type: 'divider';
      content: Record<string, never>;
    };

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
  media_kind: BannerMediaKind;
  content_mode: BannerContentMode;
  content_html: string | null;
  content_json: unknown | null;
  background_type: BannerBackgroundType;
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
  media_kind: BannerMediaKind;
  content_mode: BannerContentMode;
  content_html?: string | null;
  content_json?: unknown | null;
  background_type: BannerBackgroundType;
  background_value?: string | null;
  overlay_color?: string | null;
  text_color?: string | null;
  sort_order: number;
  is_active: boolean;
}

export type PageBlock =
  | {
      type: 'section' | 'container';
      id: string;
      props: SectionBlockProps | ContainerBlockProps;
      children: PageBlock[];
    }
  | {
      type: 'heading';
      id: string;
      props: HeadingBlockProps;
    }
  | {
      type: 'paragraph';
      id: string;
      props: ParagraphBlockProps;
    }
  | {
      type: 'image';
      id: string;
      props: ImageBlockProps;
    }
  | {
      type: 'button';
      id: string;
      props: ButtonBlockProps;
    }
  | {
      type: 'divider';
      id: string;
      props: DividerBlockProps;
    }
  | {
      type: 'spacer';
      id: string;
      props: SpacerBlockProps;
    };

export interface SectionBlockProps {
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  eyebrow?: string | null;
  background_type?: 'image' | 'video' | 'gradient' | 'solid' | string | null;
  background_value?: string | null;
  overlay_color?: string | null;
  text_color?: string | null;
  media_url?: string | null;
  media_kind?: 'image' | 'video' | string | null;
  primary_button_label?: string | null;
  primary_button_href?: string | null;
  secondary_button_label?: string | null;
  secondary_button_href?: string | null;
}

export interface ContainerBlockProps {
  layout?: 'stack' | 'grid' | string | null;
  gap?: string | null;
}

export interface HeadingBlockProps {
  text: string;
  level?: 1 | 2 | 3 | null;
  align?: 'left' | 'center' | 'right' | string | null;
}

export interface ParagraphBlockProps {
  text: string;
  align?: 'left' | 'center' | 'right' | string | null;
}

export interface ImageBlockProps {
  src: string;
  alt: string;
  caption?: string | null;
}

export interface ButtonBlockProps {
  label: string;
  href: string;
  variant?: 'solid' | 'ghost' | string | null;
}

export interface DividerBlockProps {
  style?: 'line' | 'dotted' | string | null;
}

export interface SpacerBlockProps {
  height: number;
}

export interface PageDocument {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  blocks: PageBlock[];
  is_published: boolean;
  published_on: string | null;
  created_on: string;
  modified_on: string;
}

export interface PageInput {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  blocks: PageBlock[];
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
  selected_customizations: CustomizationSelectionSnapshot[];
}

export interface CartResponse {
  cart_id: string;
  items: CartItem[];
  total_amount: number;
}

export interface CartItemInput {
  product_id: string;
  quantity: number;
  selected_customization_option_ids: string[];
}

export interface CustomizationSelectionSnapshot {
  group_id: string;
  group_name: string;
  option_id: string;
  option_name: string;
  price_delta: number;
}

export interface CheckoutInput {
  address_id?: string | null;
  notes?: string | null;
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
  notes: string | null;
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
  data?: string[];
}
