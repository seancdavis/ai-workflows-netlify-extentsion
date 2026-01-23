import { useState } from 'react';
import { Button } from '@netlify/sdk/ui/react/components';
import { trpc } from '../trpc.js';
import type { WorkflowConfig } from '../../lib/types.js';

interface WorkflowListProps {
  onEdit: (workflow: WorkflowConfig) => void;
  onViewRuns: (workflow: WorkflowConfig) => void;
}

export function WorkflowList({ onEdit, onViewRuns }: WorkflowListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { data: workflows, isLoading, refetch } = trpc.listWorkflows.useQuery();
  const deleteWorkflow = trpc.deleteWorkflow.useMutation({
    onSuccess: () => {
      refetch();
      setDeleteConfirmId(null);
    },
  });

  if (isLoading) {
    return <div style={{ padding: '1rem' }}>Loading workflows...</div>;
  }

  if (!workflows || workflows.length === 0) {
    return (
      <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--colorTextMuted)' }}>
        No workflows configured yet. Create one to get started.
      </div>
    );
  }

  const copyUrl = async (id: string) => {
    const url = `/_aiwf/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback for restricted contexts
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteWorkflow.mutateAsync({ id });
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
            border: '1px solid var(--colorGrayLighter)',
            borderRadius: '4px',
            backgroundColor: 'var(--colorBg)',
          }}
        >
          <div>
            <div style={{ fontWeight: 500 }}>{workflow.name}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--colorTextMuted)' }}>
              {workflow.provider} / {workflow.model}
            </div>
            <code style={{ fontSize: '0.75rem', color: 'var(--colorTextMuted)' }}>
              /_aiwf/{workflow.id}
            </code>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button onClick={() => copyUrl(workflow.id)}>
              {copiedId === workflow.id ? 'Copied!' : 'Copy URL'}
            </Button>
            <Button onClick={() => onViewRuns(workflow)}>
              Runs
            </Button>
            <Button onClick={() => onEdit(workflow)}>
              Edit
            </Button>
            {deleteConfirmId === workflow.id ? (
              <>
                <span className="danger-button">
                  <Button
                    onClick={() => handleDelete(workflow.id)}
                    disabled={deleteWorkflow.isPending}
                  >
                    {deleteWorkflow.isPending ? 'Deleting...' : 'Confirm'}
                  </Button>
                </span>
                <Button onClick={() => setDeleteConfirmId(null)}>
                  Cancel
                </Button>
              </>
            ) : (
              <span className="danger-button">
                <Button onClick={() => setDeleteConfirmId(workflow.id)}>
                  Delete
                </Button>
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
