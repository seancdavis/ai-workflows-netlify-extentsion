import { Button } from '@netlify/sdk/ui/react/components';
import { v4 as uuid } from 'uuid';
import type { WorkflowAction, ActionConditionOperator } from '../../lib/types.js';

interface ActionsEditorProps {
  actions: WorkflowAction[];
  onChange: (actions: WorkflowAction[]) => void;
  outputFieldNames: string[];
  inputFieldNames: string[];
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '0.25rem',
  fontWeight: 500,
  fontSize: '0.875rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  border: '1px solid rgb(126 135 146)',
  borderRadius: '4px',
  fontSize: '0.875rem',
  backgroundColor: 'var(--colorBgApp)',
  color: 'var(--colorText)',
};

const hintStyle: React.CSSProperties = {
  color: 'var(--colorTextMuted)',
};

export function ActionsEditor({ actions, onChange, outputFieldNames, inputFieldNames }: ActionsEditorProps) {
  const handleAdd = () => {
    onChange([
      ...actions,
      {
        id: uuid(),
        name: '',
        type: 'agent_runner',
        condition: { field: '', operator: 'always' },
        promptTemplate: '',
      },
    ]);
  };

  const handleRemove = (index: number) => {
    onChange(actions.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, updates: Partial<WorkflowAction>) => {
    const updated = [...actions];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const handleConditionChange = (
    index: number,
    field: 'field' | 'operator' | 'value',
    value: string
  ) => {
    const updated = [...actions];
    updated[index] = {
      ...updated[index],
      condition: { ...updated[index].condition, [field]: value },
    };
    onChange(updated);
  };

  const variableHints = [
    ...inputFieldNames.map((f) => `{{${f}}}`),
    ...outputFieldNames.map((f) => `{{output.${f}}}`),
  ].join(', ');

  return (
    <div>
      <label style={labelStyle}>Actions (optional)</label>
      <small style={{ ...hintStyle, display: 'block', marginBottom: '0.75rem' }}>
        Trigger agent runners based on AI output
      </small>

      {actions.map((action, index) => (
        <div
          key={action.id}
          style={{
            border: '1px solid var(--colorGrayLighter)',
            borderRadius: '4px',
            padding: '1rem',
            marginBottom: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>Action {index + 1}</span>
            <Button type="button" variant="danger" onClick={() => handleRemove(index)}>
              Remove
            </Button>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>Name</label>
            <input
              type="text"
              value={action.name}
              onChange={(e) => handleChange(index, { name: e.target.value })}
              placeholder="e.g. Implement site feedback"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>Condition</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <select
                value={action.condition.operator}
                onChange={(e) => handleConditionChange(index, 'operator', e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
              >
                <option value="always">Always</option>
                <option value="equals">Equals</option>
                <option value="contains">Contains</option>
              </select>
              {action.condition.operator !== 'always' && (
                <>
                  <select
                    value={action.condition.field}
                    onChange={(e) => handleConditionChange(index, 'field', e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                  >
                    <option value="">Select output field</option>
                    {outputFieldNames.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={action.condition.value || ''}
                    onChange={(e) => handleConditionChange(index, 'value', e.target.value)}
                    placeholder="Value"
                    style={{ ...inputStyle, flex: 1 }}
                  />
                </>
              )}
            </div>
          </div>

          <div>
            <label style={labelStyle}>Prompt Template</label>
            <textarea
              value={action.promptTemplate}
              onChange={(e) => handleChange(index, { promptTemplate: e.target.value })}
              placeholder="Implement the following feedback on the site: {{message}}"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
            {variableHints && (
              <small style={hintStyle}>
                Available variables: {variableHints}
              </small>
            )}
          </div>
        </div>
      ))}

      <Button type="button" onClick={handleAdd}>
        Add Action
      </Button>
    </div>
  );
}
