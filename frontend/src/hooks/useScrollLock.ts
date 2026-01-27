import { useEffect } from 'react';

export const useScrollLock = (isLocked: boolean) => {
    useEffect(() => {
        if (isLocked) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            // Prevent scrolling
            document.body.style.overflow = 'hidden';
            // Add padding to prevent layout shift if scrollbar disappears
            // This is a simple approximation; robust solutions calculate scrollbar width
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [isLocked]);
};
