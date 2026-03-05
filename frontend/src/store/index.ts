import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from '../features/auth/authSlice';
import cartReducer from '../features/cart/cartSlice';
import { productsApi } from '../features/products/productsApi';
import { ordersApi } from '../features/orders/ordersApi';
import { favoritesApi } from '../features/favorites/favoritesApi';
import { addressesApi } from '../features/addresses/addressesApi';
import { eventsApi } from '../features/events/eventsApi';
import { cartPersistenceMiddleware } from '../middleware/cartPersistenceMiddleware';
import { rtkQueryErrorLogger } from '../middleware/errorLogger';

const rootReducer = combineReducers({
  auth: authReducer,
  cart: cartReducer,
  [productsApi.reducerPath]: productsApi.reducer,
  [ordersApi.reducerPath]: ordersApi.reducer,
  [favoritesApi.reducerPath]: favoritesApi.reducer,
  [addressesApi.reducerPath]: addressesApi.reducer,
  [eventsApi.reducerPath]: eventsApi.reducer,
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
      addressesApi.middleware,
      eventsApi.middleware,
      cartPersistenceMiddleware,
      rtkQueryErrorLogger
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
