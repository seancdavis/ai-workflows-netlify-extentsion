import { useState, useEffect } from 'react';
import { Button } from '@netlify/sdk/ui/react/components';
import { trpc } from '../trpc.js';
import type { WorkflowConfig, WorkflowRun } from '../../lib/types.js';

interface RunsViewerProps {
  workflow: WorkflowConfig;
  onBack: () => void;
}

type StatusFilter = 'all' | 'queued' | 'processing' | 'success' | 'error';

export function RunsViewer({ workflow, onBack }: RunsViewerProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedRun, setSelectedRun] = useState<WorkflowRun | null>(null);

  const { data: runs, isLoading, refetch } = trpc.listRuns.useQuery({
    workflowId: workflow.id,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const retryRun = trpc.retryRun.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedRun(null);
    },
  });

  // Auto-refresh when there are queued or processing runs
  useEffect(() => {
    const hasActiveRuns = runs?.some(
      (r) => r.status === 'queued' || r.status === 'processing'
    );
    if (hasActiveRuns) {
      const interval = setInterval(() => refetch(), 3000);
      return () => clearInterval(interval);
    }
  }, [runs, refetch]);

  const getStatusColor = (status: WorkflowRun['status']) => {
    switch (status) {
      case 'queued':
        return 'var(--colorGrayDark)';
      case 'processing':
        return 'var(--colorBlueDarker)';
      case 'success':
        return 'var(--colorGreenDarker)';
      case 'error':
        return 'var(--colorRedDarker)';
      default:
        return 'var(--colorGrayDark)';
    }
  };

  const getStatusBadge = (status: WorkflowRun['status']) => (
    <span
      style={{
        display: 'inline-block',
        padding: '0.125rem 0.5rem',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 500,
        color: 'white',
        backgroundColor: getStatusColor(status),
        textTransform: 'uppercase',
      }}
    >
      {status}
    </span>
  );

  const handleRetry = async (runId: string) => {
    await retryRun.mutateAsync({
      workflowId: workflow.id,
      runId,
    });
  };

  if (isLoading) {
    return <div style={{ padding: '1rem' }}>Loading runs...</div>;
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
        }}
      >
        <div>
          <Button onClick={onBack}>
            &larr; Back
          </Button>
          <span style={{ marginLeft: '1rem', fontWeight: 500 }}>
            Runs for: {workflow.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem' }}>Filter:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            style={{
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              border: '1px solid var(--colorGrayLight)',
              backgroundColor: 'var(--colorBgApp)',
              color: 'var(--colorText)',
            }}
          >
            <option value="all">All</option>
            <option value="queued">Queued</option>
            <option value="processing">Processing</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>
          <Button onClick={() => refetch()}>
            Refresh
          </Button>
        </div>
      </div>

      {selectedRun ? (
        <div style={{ border: '1px solid var(--colorGrayLighter)', borderRadius: '4px', padding: '1rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Button onClick={() => setSelectedRun(null)}>
                &larr;
              </Button>
              <span style={{ fontWeight: 500 }}>Run Details</span>
              {getStatusBadge(selectedRun.status)}
            </div>
            {selectedRun.status === 'error' && (
              <Button
                onClick={() => handleRetry(selectedRun.id)}
                disabled={retryRun.isPending}
              >
                {retryRun.isPending ? 'Retrying...' : 'Retry'}
              </Button>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--colorTextMuted)', marginBottom: '0.25rem' }}>
              ID: {selectedRun.id}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--colorTextMuted)' }}>
              Created: {new Date(selectedRun.createdAt).toLocaleString()}
              {selectedRun.completedAt && (
                <> | Completed: {new Date(selectedRun.completedAt).toLocaleString()}</>
              )}
              {selectedRun.retryCount > 0 && (
                <> | Retry #{selectedRun.retryCount}</>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Input:</div>
            <pre
              style={{
                backgroundColor: 'var(--colorBg)',
                padding: '0.75rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                overflow: 'auto',
                maxHeight: '150px',
                color: 'var(--colorText)',
              }}
            >
              {JSON.stringify(selectedRun.input, null, 2)}
            </pre>
          </div>

          {selectedRun.output && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>Output:</div>
              <pre
                style={{
                  backgroundColor: 'var(--colorGreenLightest)',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  maxHeight: '200px',
                  color: 'var(--colorText)',
                }}
              >
                {JSON.stringify(selectedRun.output, null, 2)}
              </pre>
            </div>
          )}

          {selectedRun.error && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 500, marginBottom: '0.5rem', color: 'var(--colorRedDarker)' }}>
                Error:
              </div>
              <pre
                style={{
                  backgroundColor: 'var(--colorRedLightest)',
                  padding: '0.75rem',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  color: 'var(--colorRedDarker)',
                }}
              >
                {selectedRun.error}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <>
          {!runs || runs.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--colorTextMuted)' }}>
              No runs yet. Submit a form to{' '}
              <code style={{ backgroundColor: 'var(--colorBg)', padding: '0.125rem 0.25rem' }}>
                /_aiwf/{workflow.id}
              </code>{' '}
              to see results here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {runs.map((run) => (
                <div
                  key={run.id}
                  onClick={() => setSelectedRun(run)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    border: '1px solid var(--colorGrayLighter)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    backgroundColor: 'var(--colorBg)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {getStatusBadge(run.status)}
                      <span style={{ fontSize: '0.875rem', color: 'var(--colorTextMuted)' }}>
                        {new Date(run.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--colorTextMuted)',
                        marginTop: '0.25rem',
                      }}
                    >
                      ID: {run.id.slice(0, 8)}...
                      {run.retryCount > 0 && ` (retry #${run.retryCount})`}
                    </div>
                  </div>
                  {run.status === 'error' && (
                    <Button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleRetry(run.id);
                      }}
                      disabled={retryRun.isPending}
                    >
                      Retry
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
