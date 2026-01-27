// @ts-ignore
import teaPlaceholder from '../assets/home.webp';
import config from '../config';

/**
 * Optimizes an image URL for specific dimensions.
 * Currently optimized for Unsplash URLs.
 * 
 * @param url The original image URL
 * @param width The desired width in pixels
 * @returns The optimized URL
 */
export const getOptimizedImageUrl = (url: string, width: number = 400): string => {
    if (!url) return '';
    if (!url.includes('images.unsplash.com')) return url;

    try {
        const urlObj = new URL(url);
        urlObj.searchParams.set('w', width.toString());
        urlObj.searchParams.set('q', '80'); // Quality 80 is usually sufficient
        urlObj.searchParams.set('auto', 'format,compress');
        return urlObj.toString();
    } catch (e) {
        return url;
    }
};

export const PLACEHOLDER_TEA_IMAGE = teaPlaceholder;

export const AWS_BASE_URL = config.storage.s3BaseUrl;

/**
 * gets the full image URL. 
 * If it's an absolute URL (http/https), returns it.
 * If it's a relative path, appends it to the AWS Base URL.
 */
export const getProductImageUrl = (imagePath: string | undefined): string => {
    if (!imagePath) return PLACEHOLDER_TEA_IMAGE;
    // Return absolute URLs, blob URLs, and local assets as is
    if (imagePath.startsWith('http') || imagePath.startsWith('blob:') || imagePath.startsWith('/assets/')) {
        return imagePath;
    }
    // Remove leading slash if present in DB to avoid double slashes
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${AWS_BASE_URL}/${cleanPath}`;
};

export const transformProduct = <T extends {
    image?: string;
    images?: string[];
    imageUrls?: string[];
    productImageUrls?: string[];
}>(product: T): T => {
    const rawImages = product.images || product.imageUrls || product.productImageUrls || [];
    const firstImage = product.image || rawImages[0];

    return {
        ...product,
        image: getProductImageUrl(firstImage),
        images: rawImages.map(img => getProductImageUrl(img))
    };
};

