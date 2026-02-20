import type { ActionCondition, WorkflowAction, ActionResult } from './types.js';

const EXTENSION_URL = process.env.AIWF_EXTENSION_URL || 'https://ai-workflows.netlify.app';

export function evaluateCondition(
  condition: ActionCondition,
  output: Record<string, unknown>
): boolean {
  if (condition.operator === 'always') {
    console.log(`[actions] Condition operator is "always", returning true`);
    return true;
  }

  const fieldValue = String(output[condition.field] ?? '');
  const compareValue = condition.value ?? '';
  console.log(`[actions] Evaluating condition: output["${condition.field}"] = "${fieldValue}" ${condition.operator} "${compareValue}"`);

  switch (condition.operator) {
    case 'equals': {
      const result = fieldValue.toLowerCase() === compareValue.toLowerCase();
      console.log(`[actions] Equals result: ${result}`);
      return result;
    }
    case 'contains': {
      const result = fieldValue.toLowerCase().includes(compareValue.toLowerCase());
      console.log(`[actions] Contains result: ${result}`);
      return result;
    }
    default:
      console.log(`[actions] Unknown operator "${condition.operator}", returning false`);
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
  const url = `${EXTENSION_URL}/.netlify/functions/create-agent-runner`;
  console.log(`[actions] POST ${url} with siteId=${siteId}, prompt length=${prompt.length}`);
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId, prompt }),
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[actions] create-agent-runner failed: ${response.status}`, errorText);
      return null;
    }
    const data = await response.json();
    console.log(`[actions] Agent runner created successfully:`, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('[actions] Error calling create-agent-runner:', error);
    return null;
  }
}

export async function executeActions(
  actions: WorkflowAction[],
  input: Record<string, unknown>,
  output: Record<string, unknown>,
  siteId: string
): Promise<ActionResult[]> {
  console.log(`[actions] Executing ${actions.length} action(s) for site ${siteId}`);
  console.log(`[actions] Input:`, JSON.stringify(input));
  console.log(`[actions] Output:`, JSON.stringify(output));

  const results: ActionResult[] = [];

  for (const action of actions) {
    console.log(`[actions] Processing action "${action.name}" (${action.id}), condition:`, JSON.stringify(action.condition));
    try {
      const conditionMet = evaluateCondition(action.condition, output);

      if (!conditionMet) {
        console.log(`[actions] Action "${action.name}" skipped — condition not met`);
        results.push({
          actionId: action.id,
          actionName: action.name,
          status: 'skipped',
        });
        continue;
      }

      const prompt = interpolateActionPrompt(action.promptTemplate, input, output);
      console.log(`[actions] Action "${action.name}" condition met, interpolated prompt: "${prompt}"`);
      console.log(`[actions] Calling createAgentRunner for site ${siteId}...`);
      const runner = await createAgentRunner(siteId, prompt);

      if (!runner) {
        console.error(`[actions] Action "${action.name}" failed — no runner returned`);
        results.push({
          actionId: action.id,
          actionName: action.name,
          status: 'error',
          error: 'Failed to create agent runner',
        });
        continue;
      }

      console.log(`[actions] Action "${action.name}" triggered, runner id: ${runner.id}`);
      results.push({
        actionId: action.id,
        actionName: action.name,
        status: 'triggered',
        agentRunnerId: runner.id,
      });
    } catch (error) {
      console.error(`[actions] Action "${action.name}" threw:`, error);
      results.push({
        actionId: action.id,
        actionName: action.name,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  console.log(`[actions] All actions complete. Results:`, JSON.stringify(results));
  return results;
}
