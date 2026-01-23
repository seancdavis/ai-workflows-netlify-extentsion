import type { Context } from '@netlify/functions';
import { setWorkflowRun } from '../lib/blob-stores.js';
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
    const { siteId, run } = body as { siteId: string; run: WorkflowRun };

    if (!siteId || !run) {
      return new Response(JSON.stringify({ error: 'siteId and run required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Store run on extension site with siteId prefix
    await setWorkflowRun(run, siteId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to create run:', error);
    return new Response(JSON.stringify({ error: 'Failed to create run' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
