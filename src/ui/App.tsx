import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { Surfaces, useNetlifyExtensionUIFetch } from '@netlify/sdk/ui/react';
import { SurfaceRouter, SurfaceRoute } from '@netlify/sdk/ui/react/components';
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
        <SurfaceRouter>
          <SurfaceRoute surface={Surfaces.SiteConfiguration}>
            <SiteConfiguration />
          </SurfaceRoute>
        </SurfaceRouter>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
