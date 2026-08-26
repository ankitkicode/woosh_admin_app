import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import authReducer from '../modules/auth/store/authSlice';

// Custom storage adapter to avoid ESM import issues with redux-persist in Vite
const customStorage = {
  getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
  setItem: (key: string, item: string) => {
    window.localStorage.setItem(key, item);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    window.localStorage.removeItem(key);
    return Promise.resolve();
  },
};

const rootReducer = combineReducers({
  auth: authReducer,
});

const persistConfig = {
  key: 'woosh-admin',
  storage: customStorage,
  whitelist: ['auth'], // Only persist the auth module
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Ignore serialization warnings for redux-persist
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
