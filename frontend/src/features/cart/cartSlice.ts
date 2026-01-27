import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, Product, CustomBlend, SelectedAttributes } from '../../types';
import { loadCartFromIndexedDB, clearCartFromIndexedDB } from '../../utils/indexedDB';
import { cartApi, CartDto, AddToCartRequest, CartCustomizationRequest, MergeCartItem } from './cartApi';
import { createApiThunk } from '../../store/utils';
import { getProductImageUrl } from '../../utils/images';

interface CartState {
  items: CartItem[];
  isDrawerOpen: boolean;
  lastAddedItem: CartItem | null;
  isLoading: boolean;
  backendSyncEnabled: boolean; // Track if we're syncing with backend
}

const initialState: CartState = {
  items: [],
  isDrawerOpen: false,
  lastAddedItem: null,
  isLoading: false,
  backendSyncEnabled: false,
};

const generateItemKey = (productId: string, attributes?: SelectedAttributes, customizationId?: string) => {
  const attrPart = attributes ? JSON.stringify(Object.keys(attributes).sort().reduce((acc: any, key) => {
    acc[key] = attributes[key];
    return acc;
  }, {})) : '';
  return `${productId}-${customizationId || 'std'}-${attrPart}`;
};

/**
 * Transform frontend CartItem to backend AddToCartRequest
 */
const transformToBackendRequest = (product: Product, quantity: number, selectedAttributes?: SelectedAttributes): AddToCartRequest => {
  const customizations: CartCustomizationRequest[] = [];

  if (product.attributes && selectedAttributes) {
    product.attributes.forEach(attr => {
      const selectedValue = selectedAttributes[attr.id];
      const option = attr.options.find(o => o.value === selectedValue);
      if (option) {
        customizations.push({
          group_id: attr.id,
          option_id: option.id,
        });
      }
    });
  }

  return {
    product_id: product.id,
    quantity,
    customizations,
  };
};

/**
 * Transform backend CartDto to frontend CartItem[]
 *
 * Note: Backend items have price that already includes customizations.
 * The itemKey is set to the backend cart_item ID for authenticated users,
 * which is required for update/remove operations.
 */
const transformFromBackendResponse = (cartDto: CartDto): CartItem[] => {
  return cartDto.items.map(item => {
    // Build selected attributes from customizations
    // Note: Keys are group_name, not attr.id - this differs from local items
    const selectedAttributes: SelectedAttributes = {};
    item.customizations.forEach(cust => {
      selectedAttributes[cust.group_name] = cust.option_name;
    });

    // Calculate price with customizations already included
    const customizationPrice = item.customizations.reduce((sum, c) => sum + c.price_modifier, 0);
    const totalUnitPrice = item.unit_price + customizationPrice;

    // Get image URL safely (handle empty array)
    const imageUrls = item.image_urls || [];
    const primaryImage = imageUrls.length > 0 ? getProductImageUrl(imageUrls[0]) : '';

    const cartItem: CartItem = {
      id: item.product_id,
      // Use backend item ID as itemKey - required for authenticated user operations
      itemKey: item.id || `${item.product_id}-${JSON.stringify(selectedAttributes)}`,
      name: item.name,
      quantity: item.quantity,
      // Price already includes customizations for backend items
      price: totalUnitPrice,
      image: primaryImage,
      images: imageUrls.map(img => getProductImageUrl(img)),
      categories: [],
      rating: 0,
      tags: [],
      origin: '',
      caffeine: '',
      flavorProfile: { floral: 0, grassy: 0, nutty: 0, sweet: 0, earthy: 0 },
      brewing: { temperature: 0, time: 0, instructions: '' },
      story: '',
      format: 'Loose Leaf',
      selectedAttributes: Object.keys(selectedAttributes).length > 0 ? selectedAttributes : undefined,
      // Note: attributes array is empty for backend items - price calculation uses
      // the already-computed totalUnitPrice instead of recalculating from attributes
    };

    return cartItem;
  });
};

/**
 * Transform frontend CartItems to backend MergeCartItems for cart merge
 */
const transformToMergeItems = (items: CartItem[]): MergeCartItem[] => {
  return items.map(item => {
    const customizations: CartCustomizationRequest[] = [];

    if (item.attributes && item.selectedAttributes) {
      item.attributes.forEach(attr => {
        const selectedValue = item.selectedAttributes?.[attr.id];
        const option = attr.options.find(o => o.value === selectedValue);
        if (option) {
          customizations.push({
            group_id: attr.id,
            option_id: option.id,
          });
        }
      });
    }

    return {
      product_id: item.id,
      quantity: item.quantity,
      customizations,
    };
  });
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
      return { items, isAuthenticated: false };
    }

    // For authenticated users, return empty (backend will provide cart)
    return { items: [], isAuthenticated: true };
  }
);

/**
 * Async thunk to fetch cart from backend for authenticated users
 */
export const fetchCartFromBackend = createApiThunk(
  'cart/fetchFromBackend',
  () => cartApi.getCart(),
  (data) => transformFromBackendResponse(data)
);

/**
 * Async thunk to add item to cart via backend (for authenticated users)
 */
export const addItemToBackend = createApiThunk(
  'cart/addToBackend',
  (payload: { product: Product; quantity: number; selectedAttributes?: SelectedAttributes }) => {
    const request = transformToBackendRequest(payload.product, payload.quantity, payload.selectedAttributes);
    return cartApi.addToCart(request);
  },
  (data) => transformFromBackendResponse(data)
);

/**
 * Async thunk to update item quantity via backend (for authenticated users)
 */
export const updateItemOnBackend = createApiThunk(
  'cart/updateOnBackend',
  (payload: { itemId: string; quantity: number }) => cartApi.updateItem(payload.itemId, payload.quantity),
  (data) => transformFromBackendResponse(data)
);

/**
 * Async thunk to remove item via backend (for authenticated users)
 */
export const removeItemFromBackend = createApiThunk(
  'cart/removeFromBackend',
  (itemId: string) => cartApi.removeItem(itemId),
  (data) => transformFromBackendResponse(data)
);

/**
 * Async thunk to merge guest cart with user cart on login
 */
export const mergeCartOnLogin = createApiThunk(
  'cart/mergeOnLogin',
  async () => {
    // Get current guest cart items from IndexedDB
    const guestItems = await loadCartFromIndexedDB();

    if (guestItems.length === 0) {
      // No guest items, just fetch user cart
      return cartApi.getCart();
    }

    // Merge guest cart with user cart
    const mergeItems = transformToMergeItems(guestItems);
    const response = await cartApi.mergeCart({ items: mergeItems });

    // Clear IndexedDB after successful merge
    await clearCartFromIndexedDB();

    return response;
  },
  (data) => transformFromBackendResponse(data)
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // For guest users - local state only
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
      state.isDrawerOpen = typeof window !== 'undefined' && window.innerWidth >= 1024;

      // Persistence handled by middleware
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((i) => i.itemKey !== action.payload);
      // Persistence handled by middleware
    },
    updateQuantity: (state, action: PayloadAction<{ itemKey: string; quantity: number }>) => {
      const { itemKey, quantity } = action.payload;
      // Remove item if quantity is 0 or less (consistent with backend behavior)
      if (quantity <= 0) {
        state.items = state.items.filter((i) => i.itemKey !== itemKey);
      } else {
        const item = state.items.find((i) => i.itemKey === itemKey);
        if (item) {
          item.quantity = quantity;
        }
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
    },
    setBackendSyncEnabled: (state, action: PayloadAction<boolean>) => {
      state.backendSyncEnabled = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Load from storage (guest)
      .addCase(loadCartFromStorage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadCartFromStorage.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.isLoading = false;
        state.backendSyncEnabled = action.payload.isAuthenticated;
      })
      .addCase(loadCartFromStorage.rejected, (state) => {
        state.isLoading = false;
        console.error('Failed to load cart from storage');
      })
      // Fetch from backend (authenticated)
      .addCase(fetchCartFromBackend.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCartFromBackend.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
        state.backendSyncEnabled = true;
      })
      .addCase(fetchCartFromBackend.rejected, (state) => {
        state.isLoading = false;
        console.error('Failed to fetch cart from backend');
      })
      // Add to backend (authenticated)
      .addCase(addItemToBackend.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(addItemToBackend.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
        state.isDrawerOpen = typeof window !== 'undefined' && window.innerWidth >= 1024;
      })
      .addCase(addItemToBackend.rejected, (state, action) => {
        state.isLoading = false;
        console.error('Failed to add item to backend:', action.payload);
      })
      // Update on backend (authenticated)
      .addCase(updateItemOnBackend.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(updateItemOnBackend.rejected, (state, action) => {
        console.error('Failed to update item on backend:', action.payload);
      })
      // Remove from backend (authenticated)
      .addCase(removeItemFromBackend.fulfilled, (state, action) => {
        state.items = action.payload;
      })
      .addCase(removeItemFromBackend.rejected, (state, action) => {
        console.error('Failed to remove item from backend:', action.payload);
      })
      // Merge cart on login
      .addCase(mergeCartOnLogin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(mergeCartOnLogin.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
        state.backendSyncEnabled = true;
      })
      .addCase(mergeCartOnLogin.rejected, (state, action) => {
        state.isLoading = false;
        console.error('Failed to merge cart:', action.payload);
      });
  },
});

export const { addItem, removeItem, updateQuantity, clearCart, setCartItems, toggleDrawer, clearLastAddedItem, setBackendSyncEnabled } = cartSlice.actions;
export default cartSlice.reducer;
