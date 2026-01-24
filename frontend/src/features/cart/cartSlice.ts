import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, Product, CustomBlend, SelectedAttributes } from '../../types';
import { loadCartFromIndexedDB } from '../../utils/indexedDB';

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  lastAddedItem: CartItem | null;
  isLoading: boolean;
}

const initialState: CartState = {
  items: [],
  isDrawerOpen: false,
  lastAddedItem: null,
  isLoading: false,
};

const generateItemKey = (productId: string, attributes?: SelectedAttributes, customizationId?: string) => {
  const attrPart = attributes ? JSON.stringify(Object.keys(attributes).sort().reduce((acc: any, key) => {
    acc[key] = attributes[key];
    return acc;
  }, {})) : '';
  return `${productId}-${customizationId || 'std'}-${attrPart}`;
};

/**
 * Async thunk to load cart from IndexedDB for guest users
 * For authenticated users, cart will be loaded from backend separately
 */
export const loadCartFromStorage = createAsyncThunk(
  'cart/loadFromStorage',
  async (_, { getState }) => {
    const state = getState() as any;
    const { isAuthenticated } = state.auth;

    // Only load from IndexedDB for guest users
    if (!isAuthenticated) {
      const items = await loadCartFromIndexedDB();
      return items;
    }

    // For authenticated users, return empty (backend will provide cart)
    return [];
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<{ product: Product; quantity: number; customization?: CustomBlend; selectedAttributes?: SelectedAttributes }>) => {
      const { product, quantity, customization, selectedAttributes } = action.payload;
      const itemKey = generateItemKey(product.id, selectedAttributes, customization?.id);

      const existingIndex = state.items.findIndex((i) => i.itemKey === itemKey);
      let newItem: CartItem;

      if (existingIndex !== -1) {
        state.items[existingIndex].quantity += quantity;
        newItem = state.items[existingIndex];
      } else {
        newItem = {
          ...product,
          quantity,
          customization,
          selectedAttributes,
          itemKey
        };
        state.items.push(newItem);
      }

      state.lastAddedItem = newItem;
      // Auto-open drawer on desktop/tablet, mobile uses a different popup
      state.isDrawerOpen = window.innerWidth >= 1024;

      // Persistence handled by middleware
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.itemKey !== action.payload);
      // Persistence handled by middleware
    },
    updateQuantity: (state, action: PayloadAction<{ itemKey: string; quantity: number }>) => {
      const item = state.items.find((i) => i.itemKey === action.payload.itemKey);
      if (item) {
        item.quantity = Math.max(1, action.payload.quantity);
      }
      // Persistence handled by middleware
    },
    clearCart: (state) => {
      state.items = [];
      // Persistence handled by middleware
    },
    setCartItems: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload;
      // Used for hydration from backend or IndexedDB
    },
    toggleDrawer: (state, action: PayloadAction<boolean | undefined>) => {
      state.isDrawerOpen = action.payload !== undefined ? action.payload : !state.isDrawerOpen;
    },
    clearLastAddedItem: (state) => {
      state.lastAddedItem = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCartFromStorage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadCartFromStorage.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
      })
      .addCase(loadCartFromStorage.rejected, (state) => {
        state.isLoading = false;
        console.error('Failed to load cart from storage');
      });
  },
});

export const { addItem, removeItem, updateQuantity, clearCart, setCartItems, toggleDrawer, clearLastAddedItem } = cartSlice.actions;
export default cartSlice.reducer;
