import { CartItem } from '../types';

const DB_NAME = 'TeaHavenDB';
const STORE_NAME = 'guestCart';
const DB_VERSION = 1;
const MIGRATION_FLAG_KEY = 'cartMigrated_v2'; // Bumped version to force re-check

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize IndexedDB for cart storage
 */
export const initCartDB = async (): Promise<IDBDatabase> => {
    // Check for clear_storage flag in URL (useful for Lighthouse audits)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('clear_storage') === 'true') {
        console.log('Clearing storage based on URL parameter...');
        try {
            // Delete DB
            const req = indexedDB.deleteDatabase(DB_NAME);
            await new Promise((resolve) => {
                req.onsuccess = resolve;
                req.onerror = resolve;
            });
            // Clear localStorage
            localStorage.clear();
            // Clean URL to prevent re-clearing on refresh
            const newUrl = window.location.pathname + window.location.hash;
            window.history.replaceState({}, '', newUrl);
        } catch (e) {
            console.warn('Failed to clear storage:', e);
        }
    }

    if (dbInstance) {
        return dbInstance;
    }

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error('IndexedDB failed to open:', request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create cart store if it doesn't exist
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'itemKey' });
                objectStore.createIndex('productId', 'productId', { unique: false });
            }
        };
    });
};

/**
 * Save cart items to IndexedDB
 */
export const saveCartToIndexedDB = async (items: CartItem[]): Promise<void> => {
    try {
        const db = await initCartDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        // Clear existing items
        await new Promise<void>((resolve, reject) => {
            const clearRequest = store.clear();
            clearRequest.onsuccess = () => resolve();
            clearRequest.onerror = () => reject(clearRequest.error);
        });

        // Add all items
        const promises = items.map(item => {
            return new Promise<void>((resolve, reject) => {
                const addRequest = store.add(item);
                addRequest.onsuccess = () => resolve();
                addRequest.onerror = () => reject(addRequest.error);
            });
        });

        await Promise.all(promises);
    } catch (error) {
        console.error('Failed to save cart to IndexedDB:', error);
        throw error;
    }
};

/**
 * Load cart items from IndexedDB
 */
export const loadCartFromIndexedDB = async (): Promise<CartItem[]> => {
    try {
        const db = await initCartDB();
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        return new Promise((resolve, reject) => {
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result as CartItem[]);
            };

            request.onerror = () => {
                console.error('Failed to load cart from IndexedDB:', request.error);
                reject(request.error);
            };
        });
    } catch (error) {
        console.error('Failed to load cart from IndexedDB:', error);
        return [];
    }
};

/**
 * Clear all cart data from IndexedDB
 */
export const clearCartFromIndexedDB = async (): Promise<void> => {
    try {
        const db = await initCartDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        return new Promise((resolve, reject) => {
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Failed to clear cart from IndexedDB:', error);
        throw error;
    }
};

/**
 * Migrate cart data from localStorage to IndexedDB (one-time operation)
 */
export const migrateCartFromLocalStorage = async (): Promise<void> => {
    try {
        // Check if migration already done
        const migrated = localStorage.getItem(MIGRATION_FLAG_KEY);
        if (migrated === 'true') {
            return;
        }

        // Get cart from localStorage
        const localStorageCart = localStorage.getItem('tea_cart');
        if (!localStorageCart) {
            localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
            return;
        }

        // Parse and save to IndexedDB
        const items: CartItem[] = JSON.parse(localStorageCart);
        if (items.length > 0) {
            await saveCartToIndexedDB(items);
            console.log(`Migrated ${items.length} cart items from localStorage to IndexedDB`);
        }

        // Clean up localStorage
        localStorage.removeItem('tea_cart');
        localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    } catch (error) {
        console.error('Failed to migrate cart from localStorage:', error);
    }
};

/**
 * Check if IndexedDB is supported
 */
export const isIndexedDBSupported = (): boolean => {
    return typeof indexedDB !== 'undefined';
};
