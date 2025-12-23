import type { Config } from '@netlify/functions';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { withNetlifySDKContext } from '@netlify/sdk/ui/functions';
import { appRouter } from '../server/router.js';

export const config: Config = {
  path: ['/api/trpc', '/api/trpc/*'],
};

export default withNetlifySDKContext(async (req, context) => {
  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => context,
  });
});
