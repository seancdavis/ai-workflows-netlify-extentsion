import type { Context } from '@netlify/functions';
import { getWorkflowRun, setWorkflowRun } from '../lib/blob-stores.js';
import type { WorkflowRun } from '../lib/types.js';

export default async function handler(req: Request, _context: Context) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { siteId, workflowId, runId, updates } = body as {
      siteId: string;
      workflowId: string;
      runId: string;
      updates: Partial<WorkflowRun>;
    };

    if (!siteId || !workflowId || !runId || !updates) {
      return new Response(
        JSON.stringify({ error: 'siteId, workflowId, runId, and updates required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get existing run
    const run = await getWorkflowRun(workflowId, runId, siteId);
    if (!run) {
      return new Response(JSON.stringify({ error: 'Run not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Apply updates
    const updatedRun: WorkflowRun = {
      ...run,
      ...updates,
      id: run.id,           // Prevent overwriting ID
      workflowId: run.workflowId,  // Prevent overwriting workflowId
    };

    await setWorkflowRun(updatedRun, siteId);

    return new Response(JSON.stringify({ success: true, run: updatedRun }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to update run:', error);
    return new Response(JSON.stringify({ error: 'Failed to update run' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
