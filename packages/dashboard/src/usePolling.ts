import { useCallback, useEffect, useRef, useState } from "react";

interface PollResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
  lastUpdated: Date | null;
}

/**
 * Polls an async data source on a fixed interval.
 * The first call resolves immediately; subsequent calls run every `intervalMs`.
 * Safe against unmount — never sets state after the component is gone.
 */
export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number
): PollResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const tick = useCallback(async () => {
    try {
      const result = await fetcherRef.current();
      if (!mountedRef.current) return;
      setData(result);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void tick();
    const id = window.setInterval(() => void tick(), intervalMs);
    return () => {
      mountedRef.current = false;
      window.clearInterval(id);
    };
  }, [tick, intervalMs]);

  return { data, error, isLoading, lastUpdated };
}
