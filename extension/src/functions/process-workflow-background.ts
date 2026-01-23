import type { Context } from '@netlify/functions';
import { getWorkflowConfig, getWorkflowRun, setWorkflowRun } from '../lib/blob-stores.js';
import { callAI } from '../lib/ai-client.js';

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

  // Fetch workflow config and run
  const [config, run] = await Promise.all([
    getWorkflowConfig(workflowId),
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
