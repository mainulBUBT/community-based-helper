"use client";

import { useCallback, useEffect, useState, type DependencyList } from "react";

export function useAsync<T>(load: () => Promise<T>, deps: DependencyList, initial: T | null = null) {
  const [state, setState] = useState<{ data: T | null; error: Error | null; loading: boolean }>({
    data: initial,
    error: null,
    loading: initial === null,
  });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let alive = true;
    load().then(
      (data) => alive && setState({ data, error: null, loading: false }),
      (error: Error) => alive && setState((prev) => ({ data: prev.data, error, loading: false })),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}
