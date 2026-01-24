
import { useEffect, useRef, useState, useCallback } from 'react';

interface UseInfiniteScrollOptions {
    isLoading: boolean;
    hasMore: boolean;
    onLoadMore: () => void;
    threshold?: number;
}

export const useInfiniteScroll = ({
    isLoading,
    hasMore,
    onLoadMore,
    threshold = 0.1
}: UseInfiniteScrollOptions) => {
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isLoading && hasMore) {
                    onLoadMore();
                }
            },
            { threshold }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [isLoading, hasMore, onLoadMore, threshold]);

    return { observerTarget };
};

export const usePagination = (initialPage = 1) => {
    const [page, setPage] = useState(initialPage);

    const resetPage = useCallback(() => setPage(1), []);
    const nextPage = useCallback(() => setPage(prev => prev + 1), []);

    return { page, setPage, resetPage, nextPage };
};
