
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, Product, CustomBlend, SelectedAttributes } from '../../types';

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  lastAddedItem: CartItem | null;
}

const initialState: CartState = {
  items: JSON.parse(localStorage.getItem('tea_cart') || '[]'),
  isDrawerOpen: false,
  lastAddedItem: null,
};

const generateItemKey = (productId: string, attributes?: SelectedAttributes, customizationId?: string) => {
  const attrPart = attributes ? JSON.stringify(Object.keys(attributes).sort().reduce((acc: any, key) => {
    acc[key] = attributes[key];
    return acc;
  }, {})) : '';
  return `${productId}-${customizationId || 'std'}-${attrPart}`;
};

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

      localStorage.setItem('tea_cart', JSON.stringify(state.items));
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.itemKey !== action.payload);
      localStorage.setItem('tea_cart', JSON.stringify(state.items));
    },
    updateQuantity: (state, action: PayloadAction<{ itemKey: string; quantity: number }>) => {
      const item = state.items.find((i) => i.itemKey === action.payload.itemKey);
      if (item) {
        item.quantity = Math.max(1, action.payload.quantity);
      }
      localStorage.setItem('tea_cart', JSON.stringify(state.items));
    },
    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem('tea_cart');
    },
    toggleDrawer: (state, action: PayloadAction<boolean | undefined>) => {
      state.isDrawerOpen = action.payload !== undefined ? action.payload : !state.isDrawerOpen;
    },
    clearLastAddedItem: (state) => {
      state.lastAddedItem = null;
    }
  },
});

export const { addItem, removeItem, updateQuantity, clearCart, toggleDrawer, clearLastAddedItem } = cartSlice.actions;
export default cartSlice.reducer;
