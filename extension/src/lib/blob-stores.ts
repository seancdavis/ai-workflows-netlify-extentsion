import { getStore } from '@netlify/blobs';
import type { WorkflowConfig, WorkflowRun } from './types.js';

const CONFIGS_STORE = 'aiwf-configs';

export function getConfigsStore() {
  return getStore(CONFIGS_STORE);
}

export function getRunsStore(workflowId: string) {
  return getStore(`aiwf-runs-${workflowId}`);
}

export async function getWorkflowConfig(id: string): Promise<WorkflowConfig | null> {
  const store = getConfigsStore();
  return store.get(id, { type: 'json' });
}

export async function setWorkflowConfig(config: WorkflowConfig): Promise<void> {
  const store = getConfigsStore();
  await store.setJSON(config.id, config);
}

export async function deleteWorkflowConfig(id: string): Promise<void> {
  const store = getConfigsStore();
  await store.delete(id);
}

export async function listWorkflowConfigs(): Promise<WorkflowConfig[]> {
  const store = getConfigsStore();
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

export async function getWorkflowRun(workflowId: string, runId: string): Promise<WorkflowRun | null> {
  const store = getRunsStore(workflowId);
  return store.get(runId, { type: 'json' });
}

export async function setWorkflowRun(run: WorkflowRun): Promise<void> {
  const store = getRunsStore(run.workflowId);
  await store.setJSON(run.id, run);
}

export async function listWorkflowRuns(
  workflowId: string,
  status?: WorkflowRun['status']
): Promise<WorkflowRun[]> {
  const store = getRunsStore(workflowId);
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
