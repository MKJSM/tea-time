// @ts-ignore
import teaPlaceholder from '../assets/tea-placeholder.jpg';

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
