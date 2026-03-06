// Global test setup — runs before EVERY test file
// Extends Vitest's expect with @testing-library/jest-dom matchers
// (toBeInTheDocument, toHaveValue, toBeDisabled, etc.)
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = (function () {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        clear: () => {
            store = {};
        },
        removeItem: (key: string) => {
            delete store[key];
        },
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
});

// Polyfill for Request/Fetch in Node environment to handle relative URLs
import { fetch, Request, Response, Headers } from 'undici';
// @ts-ignore
global.fetch = fetch;
// @ts-ignore
global.Request = Request;
// @ts-ignore
global.Response = Response;
// @ts-ignore
global.Headers = Headers;

// Ensure a base URL for relative fetches
if (typeof window !== 'undefined' && !window.location.href) {
    Object.defineProperty(window, 'location', {
        value: {
            href: 'http://localhost/',
            origin: 'http://localhost',
            protocol: 'http:',
            host: 'localhost',
            hostname: 'localhost',
            port: '',
            pathname: '/',
            search: '',
            hash: '',
        },
        writable: true,
    });
}
