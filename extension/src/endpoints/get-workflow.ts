import type { Context } from '@netlify/functions';
import { getWorkflowConfig } from '../lib/blob-stores.js';

// Public endpoint to fetch workflow config
// Called by injected functions on user sites
export default async function handler(req: Request, _context: Context) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const siteId = url.searchParams.get('siteId');
  const workflowId = url.searchParams.get('workflowId');

  if (!siteId || !workflowId) {
    return new Response(JSON.stringify({ error: 'siteId and workflowId required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const config = await getWorkflowConfig(workflowId, siteId);

  if (!config) {
    return new Response(JSON.stringify({ error: 'Workflow not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(config), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
