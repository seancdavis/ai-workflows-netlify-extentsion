import type { Context } from '@netlify/functions';
import { callAI } from '../lib/ai-client.js';
import { executeActions } from '../lib/actions.js';
import type { WorkflowConfig, WorkflowRun } from '../lib/types.js';

// Extension site URL - this is where workflow configs are stored
const EXTENSION_URL = process.env.AIWF_EXTENSION_URL || 'https://ai-workflows.netlify.app';

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

async function fetchRunFromExtension(
  workflowId: string,
  runId: string,
  siteId: string
): Promise<WorkflowRun | null> {
  try {
    const url = `${EXTENSION_URL}/.netlify/functions/get-run?siteId=${siteId}&workflowId=${workflowId}&runId=${runId}`;
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Failed to fetch run from extension:', response.status, await response.text());
      return null;
    }
    return response.json();
  } catch (error) {
    console.error('Error fetching run from extension:', error);
    return null;
  }
}

async function updateRunOnExtension(
  workflowId: string,
  runId: string,
  updates: Partial<WorkflowRun>,
  siteId: string
): Promise<boolean> {
  try {
    const url = `${EXTENSION_URL}/.netlify/functions/update-run`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId, workflowId, runId, updates }),
    });
    if (!response.ok) {
      console.error('Failed to update run on extension:', response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error updating run on extension:', error);
    return false;
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

  // Fetch workflow config and run from extension site
  const [config, run] = await Promise.all([
    fetchWorkflowConfig(workflowId, siteId),
    fetchRunFromExtension(workflowId, runId, siteId),
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
  await updateRunOnExtension(workflowId, runId, {
    status: 'processing',
    startedAt: new Date().toISOString(),
  }, siteId);

  try {
    // Call AI
    const output = await callAI(config, run.input);

    // Execute actions if configured
    let actionResults;
    if (config.actions?.length) {
      actionResults = await executeActions(config.actions, run.input, output, siteId);
      console.log(`Run ${runId} action results:`, JSON.stringify(actionResults));
    }

    // Update run with success
    await updateRunOnExtension(workflowId, runId, {
      status: 'success',
      output,
      actionResults,
      completedAt: new Date().toISOString(),
    }, siteId);

    console.log(`Run ${runId} completed successfully`);
  } catch (error) {
    // Update run with error
    await updateRunOnExtension(workflowId, runId, {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      completedAt: new Date().toISOString(),
    }, siteId);

    console.error(`Run ${runId} failed:`, error);
  }

  // Background functions return 202 immediately, this response is for logging
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
