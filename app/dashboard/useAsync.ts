"use client";
import { DependencyList, useCallback, useEffect, useRef, useState } from "react";

export interface AsyncState<T> {
  data: T | null;
  /** True while a request runs, and before the first one has started/finished. */
  loading: boolean;
  error: boolean;
  reload: () => Promise<void>;
}

/**
 * Minimal fetch-state hook for dashboard widgets. Runs `fn` when `enabled`
 * becomes true and whenever `deps` change. Errors are swallowed into
 * `error` (callers use a silent AxiosHandler, so no toast per widget).
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  enabled: boolean,
  deps: DependencyList = []
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(false);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  const reload = useCallback(async () => {
    setRunning(true);
    setError(false);
    try {
      const result = await fnRef.current();
      setData(result);
    } catch {
      setError(true);
    } finally {
      setRunning(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, reload, ...deps]);

  return { data, loading: running || (enabled && data === null && !error), error, reload };
}
