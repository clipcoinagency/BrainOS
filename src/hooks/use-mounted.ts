"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Returns `true` once the component has mounted on the client, `false` during
 * server render and the first client render.
 *
 * Implemented with `useSyncExternalStore` so there is no `setState`-in-effect
 * and no hydration mismatch: the server snapshot is `false`, the client
 * snapshot is `true`.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true, // client snapshot
    () => false, // server snapshot
  );
}
