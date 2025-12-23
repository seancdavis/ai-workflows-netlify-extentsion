import { initTRPC } from '@trpc/server';
import type { NetlifySDKContext } from '@netlify/sdk/ui/functions';

export type Context = NetlifySDKContext;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
