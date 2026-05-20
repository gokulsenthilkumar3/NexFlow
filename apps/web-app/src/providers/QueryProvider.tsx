'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

/**
 * React Query provider for the NexFlow app.
 *
 * Configuration:
 * - staleTime: 30s — data is considered fresh for 30 seconds.
 * - gcTime: 5 min — inactive queries remain in cache for 5 minutes.
 * - retry: 2 — failed requests are retried twice before showing an error.
 * - refetchOnWindowFocus: true — refreshes data when the user returns to the tab.
 */

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30,        // 30 seconds
            gcTime: 1000 * 60 * 5,       // 5 minutes
            retry: 2,
            refetchOnWindowFocus: true,
            refetchOnReconnect: true,
          },
          mutations: {
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { useQueryClient } from '@tanstack/react-query';
