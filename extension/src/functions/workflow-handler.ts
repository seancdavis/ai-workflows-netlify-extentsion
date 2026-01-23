import type { Config, Context } from '@netlify/functions';
import { v4 as uuid } from 'uuid';
import { setWorkflowRun } from '../lib/blob-stores.js';
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

export default async function handler(req: Request, context: Context) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const workflowId = context.params.id;

  if (!workflowId) {
    return new Response(JSON.stringify({ error: 'Workflow ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Get site ID from environment
  const siteId = process.env.SITE_ID;
  if (!siteId) {
    return new Response(JSON.stringify({ error: 'Site ID not available' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Fetch workflow config from extension
  const config = await fetchWorkflowConfig(workflowId, siteId);

  if (!config) {
    return new Response(JSON.stringify({ error: 'Workflow not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse form data
  let formData: Record<string, unknown>;
  const contentType = req.headers.get('content-type') || '';

  try {
    if (contentType.includes('application/json')) {
      formData = await req.json();
    } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      const data = await req.formData();
      formData = {};
      data.forEach((value, key) => {
        // Skip file uploads for now - just handle text fields
        if (typeof value === 'string') {
          formData[key] = value;
        }
      });
    } else {
      return new Response(JSON.stringify({ error: 'Unsupported content type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to parse request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create run record
  const runId = uuid();
  const run: WorkflowRun = {
    id: runId,
    workflowId,
    status: 'queued',
    input: formData,
    provider: config.provider,
    model: config.model,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };

  await setWorkflowRun(run);

  // Trigger background function
  const baseUrl = new URL(req.url).origin;
  const backgroundUrl = `${baseUrl}/.netlify/functions/aiwf_process-workflow-background`;

  try {
    await fetch(backgroundUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runId, workflowId }),
    });
  } catch (error) {
    // Background function invocation failed, but run is already queued
    // The run will remain in 'queued' status and can be retried via UI
    console.error('Failed to invoke background function:', error);
  }

  // Return redirect or JSON response
  if (config.redirectUrl) {
    return Response.redirect(config.redirectUrl, 303);
  }

  return new Response(
    JSON.stringify({
      success: true,
      runId,
      message: 'Form submitted successfully. Processing in background.',
    }),
    {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export const config: Config = {
  path: '/_aiwf/:id',
};
