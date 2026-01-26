/**
 * Application Configuration
 * Centralizes all environment-specific and global configuration values.
 */

const getEnv = (key: string, defaultValue: string): string => {
    // Vite uses import.meta.env
    return import.meta.env[key] || defaultValue;
};

export const config = {
    api: {
        // Default to relative path '/api' to work with proxy/same-origin
        baseUrl: getEnv('VITE_API_URL', '/api'),
        timeout: 10000,
    },
    storage: {
        // AWS S3 Bucket for product images
        s3BaseUrl: getEnv('VITE_AWS_S3_URL', 'https://mobile-tea.s3.eu-north-1.amazonaws.com'),
    },
    app: {
        name: 'Tea Time',
        version: '1.0.0',
    }
} as const;

export default config;
