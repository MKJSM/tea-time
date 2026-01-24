import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from '../features/auth/authSlice';
import cartReducer from '../features/cart/cartSlice';
import { productsApi } from '../features/products/productsApi';
import { ordersApi } from '../features/orders/ordersApi';
import { favoritesApi } from '../features/favorites/favoritesApi';
import { cartPersistenceMiddleware } from '../middleware/cartPersistenceMiddleware';

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  [productsApi.reducerPath]: productsApi.reducer,
  [ordersApi.reducerPath]: ordersApi.reducer,
  [favoritesApi.reducerPath]: favoritesApi.reducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(
      productsApi.middleware,
      ordersApi.middleware,
      favoritesApi.middleware,
      cartPersistenceMiddleware
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
