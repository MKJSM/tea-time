/**
 * Format a number as a price string with currency symbol.
 * @param price - The price to format
 * @param currency - The currency symbol (default: ₹)
 * @returns Formatted price string (e.g., "₹150.00")
 */
export const formatPrice = (price: number, currency = '₹'): string => {
    return `${currency}${price.toFixed(2)}`;
};
