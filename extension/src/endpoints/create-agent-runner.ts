import type { Context } from '@netlify/functions';

export default async function handler(req: Request, _context: Context) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiToken = process.env.NETLIFY_API_TOKEN;
  if (!apiToken) {
    console.error('NETLIFY_API_TOKEN not configured on extension site');
    return new Response(JSON.stringify({ error: 'API token not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const { siteId, prompt } = body as { siteId: string; prompt: string };

    if (!siteId || !prompt) {
      return new Response(JSON.stringify({ error: 'siteId and prompt required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const response = await fetch(
      `https://api.netlify.com/api/v1/agent_runners?site_id=${encodeURIComponent(siteId)}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Agent Runners API error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'Failed to create agent runner', detail: errorText }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const runner = await response.json();
    return new Response(JSON.stringify(runner), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to create agent runner:', error);
    return new Response(JSON.stringify({ error: 'Failed to create agent runner' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
