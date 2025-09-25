import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

/**
 * Debounce hook for optimizing search and input operations
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Optimized data fetching hook with caching
 */
export const useOptimizedFetch = <T>(
  fetchFn: () => Promise<T>,
  dependencies: unknown[] = [],
  cacheDuration = 5 * 60 * 1000 // 5 minutes default cache
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<{ data: T; timestamp: number } | null>(null);

  const fetchData = useCallback(async () => {
    // Check cache first
    if (cacheRef.current) {
      const { data: cachedData, timestamp } = cacheRef.current;
      if (Date.now() - timestamp < cacheDuration) {
        setData(cachedData);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      cacheRef.current = { data: result, timestamp: Date.now() };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const invalidateCache = useCallback(() => {
    cacheRef.current = null;
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData, invalidateCache };
};

/**
 * Optimized list filtering hook
 */
export const useOptimizedFilter = <T>(
  items: T[],
  filterFn: (item: T, query: string) => boolean,
  searchQuery: string,
  debounceMs = 300
) => {
  const debouncedQuery = useDebounce(searchQuery, debounceMs);

  const filteredItems = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return items;
    }
    return items.filter(item => filterFn(item, debouncedQuery));
  }, [items, filterFn, debouncedQuery]);

  return filteredItems;
};

/**
 * Remove all console.log statements in production
 */
export const safeLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
};

/**
 * Performance monitoring utility
 */
export const performanceMonitor = {
  startTimer: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      performance.mark(`${label}-start`);
    }
  },
  
  endTimer: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      const measure = performance.getEntriesByName(label)[0];
      console.log(`${label}: ${measure.duration}ms`);
    }
  }
};