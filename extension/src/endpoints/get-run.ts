import type { Context } from '@netlify/functions';
import { getWorkflowRun } from '../lib/blob-stores.js';

export default async function handler(req: Request, _context: Context) {
  const url = new URL(req.url);
  const siteId = url.searchParams.get('siteId');
  const workflowId = url.searchParams.get('workflowId');
  const runId = url.searchParams.get('runId');

  if (!siteId || !workflowId || !runId) {
    return new Response(
      JSON.stringify({ error: 'siteId, workflowId, and runId are required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    const run = await getWorkflowRun(workflowId, runId, siteId);

    if (!run) {
      return new Response(JSON.stringify({ error: 'Run not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(run), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to get run:', error);
    return new Response(JSON.stringify({ error: 'Failed to get run' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
