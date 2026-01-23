import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { router, publicProcedure } from './trpc.js';
import {
  getWorkflowConfig,
  setWorkflowConfig,
  deleteWorkflowConfig,
  listWorkflowConfigs,
  getWorkflowRun,
  setWorkflowRun,
  listWorkflowRuns,
} from '../lib/blob-stores.js';
import type { WorkflowConfig, WorkflowRun, JSONSchema } from '../lib/types.js';

// Using z.any() for outputSchema as it's a complex recursive type
// Validated at runtime in the AI client
const workflowInputSchema = z.object({
  name: z.string().min(1),
  formName: z.string().optional(),
  inputFields: z.array(z.string()),
  prompt: z.string().min(1),
  outputSchema: z.any(),
  provider: z.string().min(1),
  model: z.string().min(1),
  redirectUrl: z.string().url().optional().or(z.literal('')),
});

// Helper to get blob context from tRPC context
// Returns undefined if either siteId or token is missing
function getBlobContext(ctx: { siteId: string | null; auth: { netlifyToken: string | null } }) {
  if (!ctx.siteId || !ctx.auth.netlifyToken) {
    console.log('getBlobContext: missing siteId or token', {
      hasSiteId: !!ctx.siteId,
      hasToken: !!ctx.auth.netlifyToken
    });
    return undefined;
  }
  return { siteId: ctx.siteId, token: ctx.auth.netlifyToken };
}

export const appRouter = router({
  // Workflows
  listWorkflows: publicProcedure.query(async ({ ctx }) => {
    const blobCtx = getBlobContext(ctx);
    if (!blobCtx) {
      console.error('listWorkflows: No blob context available');
      return [];
    }
    try {
      return await listWorkflowConfigs(blobCtx);
    } catch (error) {
      console.error('listWorkflows error:', error);
      throw new Error(`Failed to list workflows: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }),

  getWorkflow: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const blobCtx = getBlobContext(ctx);
      if (!blobCtx) {
        return null;
      }
      return getWorkflowConfig(input.id, blobCtx);
    }),

  createWorkflow: publicProcedure
    .input(workflowInputSchema)
    .mutation(async ({ input, ctx }) => {
      const blobCtx = getBlobContext(ctx);
      if (!blobCtx) {
        throw new Error('Cannot create workflow: missing site context');
      }
      const now = new Date().toISOString();
      const config: WorkflowConfig = {
        id: uuid(),
        name: input.name,
        formName: input.formName || undefined,
        inputFields: input.inputFields,
        prompt: input.prompt,
        outputSchema: input.outputSchema,
        provider: input.provider,
        model: input.model,
        redirectUrl: input.redirectUrl || undefined,
        createdAt: now,
        updatedAt: now,
      };
      try {
        await setWorkflowConfig(config, blobCtx);
      } catch (error) {
        console.error('createWorkflow error:', error);
        throw new Error(`Failed to save workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      return config;
    }),

  updateWorkflow: publicProcedure
    .input(z.object({ id: z.string() }).merge(workflowInputSchema))
    .mutation(async ({ input, ctx }) => {
      const blobCtx = getBlobContext(ctx);
      if (!blobCtx) {
        throw new Error('Cannot update workflow: missing site context');
      }
      const existing = await getWorkflowConfig(input.id, blobCtx);
      if (!existing) {
        throw new Error('Workflow not found');
      }
      const config: WorkflowConfig = {
        ...existing,
        name: input.name,
        formName: input.formName || undefined,
        inputFields: input.inputFields,
        prompt: input.prompt,
        outputSchema: input.outputSchema,
        provider: input.provider,
        model: input.model,
        redirectUrl: input.redirectUrl || undefined,
        updatedAt: new Date().toISOString(),
      };
      await setWorkflowConfig(config, blobCtx);
      return config;
    }),

  deleteWorkflow: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const blobCtx = getBlobContext(ctx);
      if (!blobCtx) {
        throw new Error('Cannot delete workflow: missing site context');
      }
      await deleteWorkflowConfig(input.id, blobCtx);
      return { success: true };
    }),

  // Runs
  listRuns: publicProcedure
    .input(z.object({
      workflowId: z.string(),
      status: z.enum(['queued', 'processing', 'success', 'error']).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const blobCtx = getBlobContext(ctx);
      if (!blobCtx) {
        return [];
      }
      return listWorkflowRuns(input.workflowId, input.status, blobCtx);
    }),

  getRun: publicProcedure
    .input(z.object({ workflowId: z.string(), runId: z.string() }))
    .query(async ({ input, ctx }) => {
      const blobCtx = getBlobContext(ctx);
      if (!blobCtx) {
        return null;
      }
      return getWorkflowRun(input.workflowId, input.runId, blobCtx);
    }),

  retryRun: publicProcedure
    .input(z.object({ workflowId: z.string(), runId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const blobCtx = getBlobContext(ctx);
      if (!blobCtx) {
        throw new Error('Cannot retry run: missing site context');
      }
      const originalRun = await getWorkflowRun(input.workflowId, input.runId, blobCtx);
      if (!originalRun) {
        throw new Error('Run not found');
      }

      // Create a new run with the same input
      const newRun: WorkflowRun = {
        id: uuid(),
        workflowId: input.workflowId,
        status: 'queued',
        input: originalRun.input,
        provider: originalRun.provider,
        model: originalRun.model,
        createdAt: new Date().toISOString(),
        retryCount: originalRun.retryCount + 1,
      };

      await setWorkflowRun(newRun, blobCtx);

      // Trigger background function
      // Note: In the actual extension context, we need to get the site URL
      // For now, we'll return the run and let the UI trigger the background function
      return newRun;
    }),

  // Forms - proxy to Netlify API
  listForms: publicProcedure.query(async ({ ctx }) => {
    try {
      const { client, siteId } = ctx;
      if (!siteId) {
        return [];
      }
      // Use the Netlify API client to list forms
      const forms = await client.listSiteForms(siteId);
      return (forms as Array<{ id: string; name: string }>).map((form) => ({
        id: form.id,
        name: form.name,
      }));
    } catch (error) {
      console.error('Failed to list forms:', error);
      return [];
    }
  }),

  // AI Providers - fetch from Netlify AI Gateway
  listProviders: publicProcedure.query(async () => {
    try {
      const response = await fetch('https://api.netlify.com/api/v1/ai-gateway/providers');
      if (!response.ok) {
        throw new Error('Failed to fetch providers');
      }
      const data = await response.json();

      // API returns { providers: { anthropic: { models: ["model-id", ...] }, ... } }
      // Transform to array format: [{ id, name, models: [{ id, name }, ...] }]
      const providersObj = data.providers as Record<string, {
        models: string[];
      }>;

      const providerNames: Record<string, string> = {
        anthropic: 'Anthropic',
        openai: 'OpenAI',
        gemini: 'Google',
        google: 'Google',
      };

      return Object.entries(providersObj).map(([id, provider]) => ({
        id,
        name: providerNames[id] || id,
        models: (provider.models || []).map((modelId) => ({
          id: modelId,
          name: modelId,
        })),
      }));
    } catch (error) {
      console.error('Failed to list providers:', error);
      // Return default providers as fallback
      return [
        {
          id: 'anthropic',
          name: 'Anthropic',
          models: [
            { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
            { id: 'claude-opus-4-5-20251101', name: 'Claude Opus 4.5' },
          ],
        },
        {
          id: 'openai',
          name: 'OpenAI',
          models: [
            { id: 'gpt-4o', name: 'GPT-4o' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
          ],
        },
        {
          id: 'google',
          name: 'Google',
          models: [
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
          ],
        },
      ];
    }
  }),
});

export type AppRouter = typeof appRouter;
