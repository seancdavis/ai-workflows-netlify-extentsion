import { Button } from '@netlify/sdk/ui/react/components';
import { trpc } from '../trpc.js';
import type { WorkflowConfig } from '../../lib/types.js';

interface WorkflowListProps {
  onEdit: (workflow: WorkflowConfig) => void;
  onViewRuns: (workflow: WorkflowConfig) => void;
}

export function WorkflowList({ onEdit, onViewRuns }: WorkflowListProps) {
  const { data: workflows, isLoading, refetch } = trpc.listWorkflows.useQuery();
  const deleteWorkflow = trpc.deleteWorkflow.useMutation({
    onSuccess: () => refetch(),
  });

  if (isLoading) {
    return <div style={{ padding: '1rem' }}>Loading workflows...</div>;
  }

  if (!workflows || workflows.length === 0) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
        No workflows configured yet. Create one to get started.
      </div>
    );
  }

  const copyUrl = (id: string) => {
    const url = `/_aiwf/${id}`;
    navigator.clipboard.writeText(url);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this workflow?')) {
      await deleteWorkflow.mutateAsync({ id });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {workflows.map((workflow) => (
        <div
          key={workflow.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem',
            border: '1px solid #e0e0e0',
            borderRadius: '4px',
            backgroundColor: '#fafafa',
          }}
        >
          <div>
            <div style={{ fontWeight: 500 }}>{workflow.name}</div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>
              {workflow.provider} / {workflow.model}
            </div>
            <code style={{ fontSize: '0.75rem', color: '#888' }}>
              /_aiwf/{workflow.id}
            </code>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button onClick={() => copyUrl(workflow.id)}>
              Copy URL
            </Button>
            <Button onClick={() => onViewRuns(workflow)}>
              Runs
            </Button>
            <Button onClick={() => onEdit(workflow)}>
              Edit
            </Button>
            <Button
              variant="danger"
              onClick={() => handleDelete(workflow.id)}
              disabled={deleteWorkflow.isPending}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
