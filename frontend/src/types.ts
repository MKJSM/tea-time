
export interface FlavorProfile {
  floral: number;
  grassy: number;
  nutty: number;
  sweet: number;
  earthy: number;
  spicy?: number;
}

export interface BrewingInstructions {
  temperature: number;
  time: number;
  instructions: string;
}

export type ProductFormat = 'Loose Leaf' | 'Pyramid Pod' | 'Matcha Powder' | 'Custom Blend';

export interface AttributeOption {
  id: string;
  value: string;
  displayName: string;
  priceAdjustment: number;
  inStock: boolean;
  default?: boolean;
  colorCode?: string;
}

export interface ProductAttribute {
  id: string;
  name: string;
  type: 'select' | 'color';
  required: boolean;
  helpText?: string;
  description?: string;
  options: AttributeOption[];
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  image: string;
  images?: string[];
  tags: string[];
  origin: string;
  caffeine: string;
  flavorProfile: FlavorProfile;
  brewing: BrewingInstructions;
  story: string;
  format: ProductFormat;
  attributes?: ProductAttribute[];
}

export type SelectedAttributes = Record<string, any>;

export interface BlendComponent {
  id: string;
  name: string;
  type: 'base' | 'botanical';
  ratio: number;
  color: string;
  profile?: Partial<FlavorProfile>;
}

export interface CustomBlend {
  id: string;
  name: string;
  baseTeas: BlendComponent[];
  botanicals: BlendComponent[];
  intensity: number;
  caffeineLevel: string;
  predictedProfile: FlavorProfile;
}

export interface CartItem extends Product {
  itemKey: string;
  quantity: number;
  customization?: CustomBlend;
  selectedAttributes?: SelectedAttributes;
}

export interface JournalEntry {
  id: string;
  teaId: string;
  teaName: string;
  category: string;
  origin: string;
  date: string;
  rating: number;
  image: string;
  notes: string;
  aroma: string[];
  mouthfeel: string;
  context: string;
  brewParams: {
    temp: number;
    time: number;
    vessel: string;
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  rarity: 'Common' | 'Rare' | 'Legendary';
  isUnlocked: boolean;
  progress: number;
  unlockedAt?: string;
}

export interface TeaStamp {
  id: string;
  region: string;
  country: string;
  dateStamped: string;
  visual: string;
}

export interface UserSession {
  id: string;
  device: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  level: number;
  xp: number;
  xpToNext: number;
  loyaltyPoints: number;
  stats: {
    teasTried: number;
    notesWritten: number;
    streakDays: number;
    regionsExplored: number;
  };
  journal: JournalEntry[];
  achievements: Achievement[];
  passport: TeaStamp[];
  preferences: string[];
  sessions: UserSession[];
  security: {
    twoFactorEnabled: boolean;
    lastPasswordChange: string;
  };
}

export enum OrderStatus {
  PLACED = 'Placed',
  CONFIRMED = 'Confirmed',
  PROCESSING = 'Processing',
  SHIPPED = 'Shipped',
  OUT_FOR_DELIVERY = 'Out for Delivery',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled'
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  items: any[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  status: OrderStatus;
  deliveryAddress: string;
  timeline: any[];
}
