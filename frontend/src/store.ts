
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, CartItem, User, Order, OrderStatus, CustomBlend } from './types';

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, customization?: CustomBlend) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1, customization) => {
        const itemKey = customization ? `${product.id}-${customization.id}` : product.id;
        const existing = get().items.find((i) => (customization ? i.customization?.id === customization.id : i.id === product.id));
        
        if (existing) {
          set({
            items: get().items.map((i) =>
              (customization ? i.customization?.id === customization.id : i.id === product.id)
                ? { ...i, quantity: i.quantity + quantity }
                : i
            ),
          });
        } else {
          set({ items: [...get().items, { ...product, itemKey, quantity, customization }] });
        }
      },
      removeItem: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      updateQuantity: (id, q) =>
        set({
          items: get().items.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, q) } : i)),
        }),
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    }),
    { name: 'tea-haven-cart-v2' }
  )
);

interface SommelierState {
  currentMood: string;
  setMood: (mood: string) => void;
  activeBlend: CustomBlend;
  updateBlend: (updates: Partial<CustomBlend>) => void;
}

export const useSommelierStore = create<SommelierState>((set) => ({
  currentMood: 'Focused',
  setMood: (currentMood) => set({ currentMood }),
  activeBlend: {
    id: 'blend-new',
    name: 'Untitled Masterpiece',
    baseTeas: [{ id: 'b1', name: 'Japanese Sencha', type: 'base', ratio: 100, color: '#4CAF50' }],
    botanicals: [],
    intensity: 5,
    caffeineLevel: 'Medium',
    predictedProfile: { floral: 2, grassy: 8, nutty: 3, sweet: 4, earthy: 1 }
  },
  updateBlend: (updates) => set((state) => ({ activeBlend: { ...state.activeBlend, ...updates } })),
}));

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (email) =>
        set({
          user: {
            id: '1',
            name: email.split('@')[0],
            email,
            avatar: 'https://picsum.photos/seed/teauser/200',
            level: 1,
            xp: 0,
            xpToNext: 100,
            loyaltyPoints: 450,
            stats: {
              teasTried: 0,
              notesWritten: 0,
              streakDays: 0,
              regionsExplored: 0,
            },
            journal: [],
            achievements: [],
            passport: [],
            preferences: ['Green Tea', 'Oolong'],
            sessions: [],
            security: {
              twoFactorEnabled: false,
              lastPasswordChange: new Date().toISOString(),
            },
          },
          isAuthenticated: true,
        }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    { name: 'tea-haven-auth' }
  )
);

interface ProductState {
  products: Product[];
  setProducts: (products: Product[]) => void;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  setProducts: (products) => set({ products }),
}));
