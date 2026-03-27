import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface CacheEntry {
  data: any;
  timestamp: number;
}

interface PageCacheContextValue {
  /** Get cached data if it exists and hasn't expired. Returns undefined on miss. */
  get: (key: string, maxAgeMs?: number) => any | undefined;
  /** Store data under a key. */
  set: (key: string, data: any) => void;
  /** Delete specific cache keys. */
  invalidate: (...keys: string[]) => void;
  /** Delete all keys that start with the given prefix. */
  invalidatePrefix: (prefix: string) => void;
  /** Nuke everything. */
  invalidateAll: () => void;
}

const PageCacheContext = createContext<PageCacheContextValue | null>(null);

const DEFAULT_MAX_AGE = 5 * 60 * 1000; // 5 minutes

// ── Provider ───────────────────────────────────────────────────────────────────

export const PageCacheProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const store = useRef(new Map<string, CacheEntry>());

  const get = useCallback((key: string, maxAgeMs = DEFAULT_MAX_AGE): any | undefined => {
    const entry = store.current.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.timestamp > maxAgeMs) {
      store.current.delete(key);
      return undefined;
    }
    return entry.data;
  }, []);

  const set = useCallback((key: string, data: any) => {
    store.current.set(key, { data, timestamp: Date.now() });
  }, []);

  const invalidate = useCallback((...keys: string[]) => {
    keys.forEach((k) => store.current.delete(k));
  }, []);

  const invalidatePrefix = useCallback((prefix: string) => {
    for (const key of Array.from(store.current.keys())) {
      if (key.startsWith(prefix)) store.current.delete(key);
    }
  }, []);

  const invalidateAll = useCallback(() => {
    store.current.clear();
  }, []);

  return (
    <PageCacheContext.Provider value={{ get, set, invalidate, invalidatePrefix, invalidateAll }}>
      {children}
    </PageCacheContext.Provider>
  );
};

// ── Low-level hook ─────────────────────────────────────────────────────────────

export function usePageCache(): PageCacheContextValue {
  const ctx = useContext(PageCacheContext);
  if (!ctx) throw new Error("usePageCache must be used within a PageCacheProvider");
  return ctx;
}

// ── Convenience hook: auto-fetch with cache ────────────────────────────────────

/**
 * Fetches data once per cache-key, returning cached results on revisit.
 *
 * @param key   Unique cache key (encode params in the key).  Pass `null` to skip.
 * @param fetcher  Async function that returns the data.
 * @param maxAge   How long (ms) cached data is considered fresh. Default 5 min.
 *
 * @returns `{ data, loading, refresh }` — call `refresh()` to force re-fetch.
 */
export function useCachedData<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  maxAge: number = DEFAULT_MAX_AGE,
): { data: T | null; loading: boolean; refresh: () => Promise<void> } {
  const cache = usePageCache();

  // Initialise from cache synchronously (avoids flash-of-loading on back-nav)
  const [data, setData] = useState<T | null>(() => {
    if (!key) return null;
    return cache.get(key, maxAge) ?? null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    if (!key) return false;
    return cache.get(key, maxAge) === undefined;
  });

  // Keep fetcher ref stable so effect doesn't re-run on inline closures
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const keyRef = useRef(key);
  keyRef.current = key;

  const refresh = useCallback(async () => {
    const k = keyRef.current;
    if (!k) return;
    setLoading(true);
    try {
      const result = await fetcherRef.current();
      cache.set(k, result);
      setData(result);
    } catch (err) {
      console.error(`[PageCache] fetch error for "${k}":`, err);
    } finally {
      setLoading(false);
    }
  }, [cache]);

  useEffect(() => {
    if (!key) {
      setData(null);
      setLoading(false);
      return;
    }

    const cached = cache.get(key, maxAge);
    if (cached !== undefined) {
      setData(cached);
      setLoading(false);
      return;
    }

    // Cache miss → fetch
    let cancelled = false;
    setLoading(true);
    fetcherRef.current()
      .then((result) => {
        if (cancelled) return;
        cache.set(key, result);
        setData(result);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(`[PageCache] fetch error for "${key}":`, err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [key, maxAge, cache]);

  return { data, loading, refresh };
}
