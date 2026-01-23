import { getStore } from '@netlify/blobs';
import type { WorkflowConfig, WorkflowRun } from './types.js';

const CONFIGS_STORE = 'aiwf-configs';

// Store blobs on the extension's site, namespaced by siteId in the key
// This is used by the extension UI (tRPC endpoints)
export function getConfigsStore() {
  return getStore(CONFIGS_STORE);
}

export function getRunsStore(workflowId: string) {
  return getStore(`aiwf-runs-${workflowId}`);
}

// Create site-namespaced keys
function siteKey(siteId: string | undefined, key: string): string {
  return siteId ? `${siteId}:${key}` : key;
}

export async function getWorkflowConfig(id: string, siteId?: string): Promise<WorkflowConfig | null> {
  const store = getConfigsStore();
  return store.get(siteKey(siteId, id), { type: 'json' });
}

export async function setWorkflowConfig(config: WorkflowConfig, siteId?: string): Promise<void> {
  const store = getConfigsStore();
  await store.setJSON(siteKey(siteId, config.id), config);
}

export async function deleteWorkflowConfig(id: string, siteId?: string): Promise<void> {
  const store = getConfigsStore();
  await store.delete(siteKey(siteId, id));
}

export async function listWorkflowConfigs(siteId?: string): Promise<WorkflowConfig[]> {
  const store = getConfigsStore();
  const { blobs } = await store.list();
  const configs: WorkflowConfig[] = [];

  const prefix = siteId ? `${siteId}:` : '';

  for (const blob of blobs) {
    if (siteId && !blob.key.startsWith(prefix)) {
      continue;
    }
    const config = await store.get(blob.key, { type: 'json' }) as WorkflowConfig | null;
    if (config) {
      configs.push(config);
    }
  }

  return configs.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getWorkflowRun(workflowId: string, runId: string, siteId?: string): Promise<WorkflowRun | null> {
  const store = getRunsStore(siteKey(siteId, workflowId));
  return store.get(runId, { type: 'json' });
}

export async function setWorkflowRun(run: WorkflowRun, siteId?: string): Promise<void> {
  const store = getRunsStore(siteKey(siteId, run.workflowId));
  await store.setJSON(run.id, run);
}

export async function listWorkflowRuns(
  workflowId: string,
  status?: WorkflowRun['status'],
  siteId?: string
): Promise<WorkflowRun[]> {
  const store = getRunsStore(siteKey(siteId, workflowId));
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
