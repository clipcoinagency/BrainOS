"use client";

import { useEffect, useMemo, useRef } from "react";

/**
 * Returns a debounced version of `callback` that delays invocation until
 * `delayMs` has elapsed since the last call. The debounced function is stable
 * across renders; the latest `callback` is always used (no stale closures) —
 * `callbackRef` is updated in an Effect (after commit, not during render) so
 * the async `setTimeout` callback below can safely read it. `useEffectEvent`
 * cannot be used here: React restricts it to being called only from Effects,
 * and this ref is read from a `setTimeout` callback, not an Effect.
 *
 * Pending calls are cancelled on unmount.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number,
): (...args: Args) => void {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return useMemo(() => {
    return (...args: Args) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delayMs);
    };
  }, [delayMs]);
}
