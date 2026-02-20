export interface JSONSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema;
  required?: string[];
  enum?: string[];
  description?: string;
}

export type ActionConditionOperator = 'always' | 'equals' | 'contains';

export interface ActionCondition {
  field: string;
  operator: ActionConditionOperator;
  value?: string;
}

export interface WorkflowAction {
  id: string;
  name: string;
  type: 'agent_runner';
  condition: ActionCondition;
  promptTemplate: string;
}

export interface ActionResult {
  actionId: string;
  actionName: string;
  status: 'triggered' | 'skipped' | 'error';
  agentRunnerId?: string;
  error?: string;
}

export interface WorkflowConfig {
  id: string;
  name: string;
  formName?: string;
  inputFields: string[];
  prompt: string;
  outputSchema: JSONSchema;
  provider: string;
  model: string;
  redirectUrl?: string;
  actions?: WorkflowAction[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  status: 'queued' | 'processing' | 'success' | 'error';
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  actionResults?: ActionResult[];
  provider: string;
  model: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  retryCount: number;
}

export interface AIProvider {
  id: string;
  name: string;
  models: AIModel[];
}

export interface AIModel {
  id: string;
  name: string;
}
