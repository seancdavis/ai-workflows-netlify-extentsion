import { getStore } from '@netlify/blobs';
import type { WorkflowConfig, WorkflowRun } from './types.js';

const CONFIGS_STORE = 'aiwf-configs';

export function getConfigsStore(siteId?: string) {
  return getStore({ name: CONFIGS_STORE, siteID: siteId });
}

export function getRunsStore(workflowId: string, siteId?: string) {
  return getStore({ name: `aiwf-runs-${workflowId}`, siteID: siteId });
}

export async function getWorkflowConfig(id: string, siteId?: string): Promise<WorkflowConfig | null> {
  const store = getConfigsStore(siteId);
  return store.get(id, { type: 'json' });
}

export async function setWorkflowConfig(config: WorkflowConfig, siteId?: string): Promise<void> {
  const store = getConfigsStore(siteId);
  await store.setJSON(config.id, config);
}

export async function deleteWorkflowConfig(id: string, siteId?: string): Promise<void> {
  const store = getConfigsStore(siteId);
  await store.delete(id);
}

export async function listWorkflowConfigs(siteId?: string): Promise<WorkflowConfig[]> {
  const store = getConfigsStore(siteId);
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

export async function getWorkflowRun(workflowId: string, runId: string, siteId?: string): Promise<WorkflowRun | null> {
  const store = getRunsStore(workflowId, siteId);
  return store.get(runId, { type: 'json' });
}

export async function setWorkflowRun(run: WorkflowRun, siteId?: string): Promise<void> {
  const store = getRunsStore(run.workflowId, siteId);
  await store.setJSON(run.id, run);
}

export async function listWorkflowRuns(
  workflowId: string,
  status?: WorkflowRun['status'],
  siteId?: string
): Promise<WorkflowRun[]> {
  const store = getRunsStore(workflowId, siteId);
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
