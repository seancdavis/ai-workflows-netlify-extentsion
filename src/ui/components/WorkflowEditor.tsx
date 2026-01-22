import { useState, useEffect } from 'react';
import { Button, Select } from '@netlify/sdk/ui/react/components';
import { trpc } from '../trpc.js';
import type { WorkflowConfig, JSONSchema } from '../../lib/types.js';

interface WorkflowEditorProps {
  workflow: WorkflowConfig | null;
  onSaved: () => void;
  onCancel: () => void;
}

interface OutputField {
  name: string;
  type: 'string' | 'number' | 'boolean';
}

export function WorkflowEditor({ workflow, onSaved, onCancel }: WorkflowEditorProps) {
  const [name, setName] = useState(workflow?.name || '');
  const [formName, setFormName] = useState(workflow?.formName || '');
  const [inputFields, setInputFields] = useState(workflow?.inputFields.join(', ') || '');
  const [prompt, setPrompt] = useState(workflow?.prompt || '');
  const [provider, setProvider] = useState(workflow?.provider || 'anthropic');
  const [model, setModel] = useState(workflow?.model || '');
  const [redirectUrl, setRedirectUrl] = useState(workflow?.redirectUrl || '');
  const [outputFields, setOutputFields] = useState<OutputField[]>(() => {
    if (workflow?.outputSchema?.properties) {
      return Object.entries(workflow.outputSchema.properties).map(([fieldName, schema]) => ({
        name: fieldName,
        type: (schema as JSONSchema).type as 'string' | 'number' | 'boolean',
      }));
    }
    return [{ name: '', type: 'string' }];
  });

  const { data: providers } = trpc.listProviders.useQuery();
  const { data: forms } = trpc.listForms.useQuery();

  const createWorkflow = trpc.createWorkflow.useMutation({ onSuccess: onSaved });
  const updateWorkflow = trpc.updateWorkflow.useMutation({ onSuccess: onSaved });

  const isEditing = !!workflow;
  const isPending = createWorkflow.isPending || updateWorkflow.isPending;

  // Set default model when provider changes
  useEffect(() => {
    if (providers && !model) {
      const selectedProvider = providers.find((p) => p.id === provider);
      if (selectedProvider?.models?.[0]) {
        setModel(selectedProvider.models[0].id);
      }
    }
  }, [providers, provider, model]);

  const selectedProviderData = providers?.find((p) => p.id === provider);

  const handleAddOutputField = () => {
    setOutputFields([...outputFields, { name: '', type: 'string' }]);
  };

  const handleRemoveOutputField = (index: number) => {
    setOutputFields(outputFields.filter((_, i) => i !== index));
  };

  const handleOutputFieldChange = (
    index: number,
    field: 'name' | 'type',
    value: string
  ) => {
    const updated = [...outputFields];
    if (field === 'type') {
      updated[index].type = value as 'string' | 'number' | 'boolean';
    } else {
      updated[index].name = value;
    }
    setOutputFields(updated);
  };

  const buildOutputSchema = (): JSONSchema => {
    const properties: Record<string, JSONSchema> = {};
    const required: string[] = [];

    for (const field of outputFields) {
      if (field.name.trim()) {
        properties[field.name.trim()] = { type: field.type };
        required.push(field.name.trim());
      }
    }

    return {
      type: 'object',
      properties,
      required,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name,
      formName: formName || undefined,
      inputFields: inputFields.split(',').map((f) => f.trim()).filter(Boolean),
      prompt,
      outputSchema: buildOutputSchema(),
      provider,
      model,
      redirectUrl: redirectUrl || undefined,
    };

    if (isEditing && workflow) {
      await updateWorkflow.mutateAsync({ id: workflow.id, ...data });
    } else {
      await createWorkflow.mutateAsync(data);
    }
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '0.25rem',
    fontWeight: 500,
    fontSize: '0.875rem',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem',
    border: '1px solid var(--colorGray)',
    borderRadius: '4px',
    fontSize: '0.875rem',
    backgroundColor: 'var(--colorBgApp)',
    color: 'var(--colorText)',
  };

  const fieldGroupStyle: React.CSSProperties = {
    marginBottom: '1rem',
  };

  const hintStyle: React.CSSProperties = {
    color: 'var(--colorTextMuted)',
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={{ marginBottom: '1rem' }}>
        {isEditing ? 'Edit Workflow' : 'Create Workflow'}
      </h3>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Form Processor"
          required
          style={inputStyle}
        />
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Form (optional)</label>
        {forms && forms.length > 0 ? (
          <select
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            style={inputStyle}
          >
            <option value="">Select a form or enter manually</option>
            {forms.map((form) => (
              <option key={form.id} value={form.name}>
                {form.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="contact-form"
            style={inputStyle}
          />
        )}
        <small style={hintStyle}>
          Reference name for this workflow (doesn't affect functionality)
        </small>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Input Fields</label>
        <input
          type="text"
          value={inputFields}
          onChange={(e) => setInputFields(e.target.value)}
          placeholder="name, email, message"
          required
          style={inputStyle}
        />
        <small style={hintStyle}>
          Comma-separated list of expected form field names
        </small>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Transform this contact form submission into a structured lead record. Extract the person's name, categorize the inquiry type, and summarize the message in one sentence."
          required
          rows={4}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
        <small style={hintStyle}>
          Use {'{{fieldName}}'} to reference form fields (e.g., {'{{name}}'}, {'{{email}}'})
        </small>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Output Schema</label>
        <small style={{ ...hintStyle, display: 'block', marginBottom: '0.5rem' }}>
          Define the fields the AI should output
        </small>
        {outputFields.map((field, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              value={field.name}
              onChange={(e) => handleOutputFieldChange(index, 'name', e.target.value)}
              placeholder="Field name"
              style={{ ...inputStyle, flex: 2 }}
            />
            <select
              value={field.type}
              onChange={(e) => handleOutputFieldChange(index, 'type', e.target.value)}
              style={{ ...inputStyle, flex: 1 }}
            >
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
            </select>
            {outputFields.length > 1 && (
              <Button
                type="button"
                variant="danger"
                onClick={() => handleRemoveOutputField(index)}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
        <Button type="button" onClick={handleAddOutputField}>
          Add Field
        </Button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Provider</label>
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              setModel('');
            }}
            required
            style={inputStyle}
          >
            {providers?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            required
            style={inputStyle}
          >
            {selectedProviderData?.models?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={fieldGroupStyle}>
        <label style={labelStyle}>Redirect URL (optional)</label>
        <input
          type="url"
          value={redirectUrl}
          onChange={(e) => setRedirectUrl(e.target.value)}
          placeholder="https://example.com/thank-you"
          style={inputStyle}
        />
        <small style={hintStyle}>
          Where to redirect after form submission. If empty, returns JSON response.
        </small>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Workflow'}
        </Button>
        <Button type="button" variant="standard" onClick={onCancel}>
          Cancel
        </Button>
      </div>

      {(createWorkflow.error || updateWorkflow.error) && (
        <div style={{ color: 'var(--colorRedDarker)', marginTop: '1rem' }}>
          Error: {createWorkflow.error?.message || updateWorkflow.error?.message}
        </div>
      )}
    </form>
  );
}
