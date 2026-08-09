"use client";

import { useState } from "react";

import {
  QueryClient,
  QueryClientProvider,
  isServer,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, a non-zero staleTime avoids refetching immediately on the
        // client for data that was just fetched on the server.
        staleTime: 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (isServer) {
    // Server: always make a fresh client so requests never share state.
    return makeQueryClient();
  }
  // Browser: reuse one client across renders/suspense boundaries.
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}

/**
 * Provides a TanStack Query client. Uses the recommended SSR-safe singleton
 * pattern: a new client per request on the server, a shared client in the
 * browser.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // `useState` ensures the same client survives re-renders on the client.
  const [queryClient] = useState(getQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" ? (
        <ReactQueryDevtools initialIsOpen={false} />
      ) : null}
    </QueryClientProvider>
  );
}
