import type { ActionCondition, WorkflowAction, ActionResult } from './types.js';

const EXTENSION_URL = process.env.AIWF_EXTENSION_URL || 'https://ai-workflows.netlify.app';

export function evaluateCondition(
  condition: ActionCondition,
  output: Record<string, unknown>
): boolean {
  if (condition.operator === 'always') {
    return true;
  }

  const fieldValue = String(output[condition.field] ?? '');
  const compareValue = condition.value ?? '';

  switch (condition.operator) {
    case 'equals':
      return fieldValue.toLowerCase() === compareValue.toLowerCase();
    case 'contains':
      return fieldValue.toLowerCase().includes(compareValue.toLowerCase());
    default:
      return false;
  }
}

export function interpolateActionPrompt(
  template: string,
  input: Record<string, unknown>,
  output: Record<string, unknown>
): string {
  return template.replace(/\{\{(.*?)\}\}/g, (_match, key: string) => {
    const trimmed = key.trim();
    if (trimmed.startsWith('output.')) {
      const outputKey = trimmed.slice('output.'.length);
      return String(output[outputKey] ?? '');
    }
    return String(input[trimmed] ?? '');
  });
}

async function createAgentRunner(
  siteId: string,
  prompt: string
): Promise<{ id: string } | null> {
  try {
    const url = `${EXTENSION_URL}/.netlify/functions/create-agent-runner`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId, prompt }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create agent runner:', response.status, errorText);
      return null;
    }
    return response.json();
  } catch (error) {
    console.error('Error creating agent runner:', error);
    return null;
  }
}

export async function executeActions(
  actions: WorkflowAction[],
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  siteId: string
): Promise<ActionResult[]> {
  const results: ActionResult[] = [];

  for (const action of actions) {
    try {
      const conditionMet = evaluateCondition(action.condition, output);

      if (!conditionMet) {
        results.push({
          actionId: action.id,
          actionName: action.name,
          status: 'skipped',
        });
        continue;
      }

      const prompt = interpolateActionPrompt(action.promptTemplate, input, output);
      const runner = await createAgentRunner(siteId, prompt);

      if (!runner) {
        results.push({
          actionId: action.id,
          actionName: action.name,
          status: 'error',
          error: 'Failed to create agent runner',
        });
        continue;
      }

      results.push({
        actionId: action.id,
        actionName: action.name,
        status: 'triggered',
        agentRunnerId: runner.id,
      });
    } catch (error) {
      results.push({
        actionId: action.id,
        actionName: action.name,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}
