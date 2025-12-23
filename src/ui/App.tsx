import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useNetlifyExtensionUIFetch } from '@netlify/sdk/ui/react';
import { trpc } from './trpc.js';
import { SiteConfiguration } from './surfaces/SiteConfiguration.js';

export function App() {
  const fetch = useNetlifyExtensionUIFetch();
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          fetch,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SiteConfiguration />
      </QueryClientProvider>
    </trpc.Provider>
  );
}
