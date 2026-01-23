import type { Context } from '@netlify/functions';
import { getWorkflowRun, setWorkflowRun } from '../lib/blob-stores.js';
import { callAI } from '../lib/ai-client.js';
import type { WorkflowConfig } from '../lib/types.js';

// Extension site URL - this is where workflow configs are stored
const EXTENSION_URL = process.env.AIWF_EXTENSION_URL || 'https://0-19k8k9-ai-workflows.netlify.app';

async function fetchWorkflowConfig(workflowId: string, siteId: string): Promise<WorkflowConfig | null> {
  try {
    const url = `${EXTENSION_URL}/.netlify/functions/get-workflow?siteId=${siteId}&workflowId=${workflowId}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Failed to fetch workflow config:', response.status, await response.text());
      return null;
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching workflow config:', error);
    return null;
  }
}

interface RequestBody {
  runId: string;
  workflowId: string;
}

export default async function handler(req: Request, _context: Context) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { runId, workflowId } = body;

  if (!runId || !workflowId) {
    return new Response(JSON.stringify({ error: 'runId and workflowId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get site ID from environment
  const siteId = process.env.SITE_ID;
  if (!siteId) {
    console.error('Site ID not available');
    return new Response(JSON.stringify({ error: 'Site ID not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch workflow config from extension and run from local store
  const [config, run] = await Promise.all([
    fetchWorkflowConfig(workflowId, siteId),
    getWorkflowRun(workflowId, runId),
  ]);

  if (!config) {
    console.error(`Workflow not found: ${workflowId}`);
    return new Response(JSON.stringify({ error: 'Workflow not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!run) {
    console.error(`Run not found: ${runId}`);
    return new Response(JSON.stringify({ error: 'Run not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Update run status to processing
  run.status = 'processing';
  run.startedAt = new Date().toISOString();
  await setWorkflowRun(run);

  try {
    // Call AI
    const output = await callAI(config, run.input);

    // Update run with success
    run.status = 'success';
    run.output = output;
    run.completedAt = new Date().toISOString();
    await setWorkflowRun(run);

    console.log(`Run ${runId} completed successfully`);
  } catch (error) {
    // Update run with error
    run.status = 'error';
    run.error = error instanceof Error ? error.message : 'Unknown error';
    run.completedAt = new Date().toISOString();
    await setWorkflowRun(run);

    console.error(`Run ${runId} failed:`, error);
  }

  // Background functions return 202 immediately, this response is for logging
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
