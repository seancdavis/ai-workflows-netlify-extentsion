import { getStore } from '@netlify/blobs';
import type { WorkflowConfig, WorkflowRun } from './types.js';

const CONFIGS_STORE = 'aiwf-configs';

interface BlobContext {
  siteId?: string;
  token?: string;
}

export function getConfigsStore(ctx?: BlobContext) {
  if (ctx?.siteId && ctx?.token) {
    return getStore({ name: CONFIGS_STORE, siteID: ctx.siteId, token: ctx.token });
  }
  return getStore(CONFIGS_STORE);
}

export function getRunsStore(workflowId: string, ctx?: BlobContext) {
  if (ctx?.siteId && ctx?.token) {
    return getStore({ name: `aiwf-runs-${workflowId}`, siteID: ctx.siteId, token: ctx.token });
  }
  return getStore(`aiwf-runs-${workflowId}`);
}

export async function getWorkflowConfig(id: string, ctx?: BlobContext): Promise<WorkflowConfig | null> {
  const store = getConfigsStore(ctx);
  return store.get(id, { type: 'json' });
}

export async function setWorkflowConfig(config: WorkflowConfig, ctx?: BlobContext): Promise<void> {
  const store = getConfigsStore(ctx);
  await store.setJSON(config.id, config);
}

export async function deleteWorkflowConfig(id: string, ctx?: BlobContext): Promise<void> {
  const store = getConfigsStore(ctx);
  await store.delete(id);
}

export async function listWorkflowConfigs(ctx?: BlobContext): Promise<WorkflowConfig[]> {
  const store = getConfigsStore(ctx);
  const { blobs } = await store.list();
  const configs: WorkflowConfig[] = [];

  for (const blob of blobs) {
    const config = await store.get(blob.key, { type: 'json' }) as WorkflowConfig | null;
    if (config) {
      configs.push(config);
    }
  }

  return configs.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getWorkflowRun(workflowId: string, runId: string, ctx?: BlobContext): Promise<WorkflowRun | null> {
  const store = getRunsStore(workflowId, ctx);
  return store.get(runId, { type: 'json' });
}

export async function setWorkflowRun(run: WorkflowRun, ctx?: BlobContext): Promise<void> {
  const store = getRunsStore(run.workflowId, ctx);
  await store.setJSON(run.id, run);
}

export async function listWorkflowRuns(
  workflowId: string,
  status?: WorkflowRun['status'],
  ctx?: BlobContext
): Promise<WorkflowRun[]> {
  const store = getRunsStore(workflowId, ctx);
  const { blobs } = await store.list();
  const runs: WorkflowRun[] = [];

  for (const blob of blobs) {
    const run = await store.get(blob.key, { type: 'json' }) as WorkflowRun | null;
    if (run && (!status || run.status === status)) {
      runs.push(run);
    }
  }

  return runs.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
