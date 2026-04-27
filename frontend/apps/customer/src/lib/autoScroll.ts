import { useEffect, type RefObject } from 'react';

/**
 * Periodically scrolls a horizontal container to the next item.
 * @param containerRef Reference to the scrollable container.
 * @param imageCount Total number of images in the scroller.
 * @param intervalMs How often to scroll (default 4000ms).
 */
export function useAutoScroll(
    containerRef: RefObject<HTMLDivElement | null>,
    imageCount: number,
    intervalMs = 4000,
) {
    useEffect(() => {
        const el = containerRef.current;
        if (!el || imageCount <= 1) return;

        // Add a slight random delay (0-1500ms) to prevent all cards from scrolling at once
        const initialDelay = Math.random() * 1500;

        const timeoutId = window.setTimeout(() => {
            const intervalId = window.setInterval(() => {
                const { scrollLeft, clientWidth, scrollWidth } = el;

                // If we're near the end, scroll back to start
                if (scrollLeft + clientWidth >= scrollWidth - 5) {
                    el.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    el.scrollBy({ left: clientWidth, behavior: 'smooth' });
                }
            }, intervalMs);

            (el as any)._autoScrollInterval = intervalId;
        }, initialDelay);

        return () => {
            window.clearTimeout(timeoutId);
            if ((el as any)._autoScrollInterval) {
                window.clearInterval((el as any)._autoScrollInterval);
            }
        };
    }, [containerRef, imageCount, intervalMs]);
}
