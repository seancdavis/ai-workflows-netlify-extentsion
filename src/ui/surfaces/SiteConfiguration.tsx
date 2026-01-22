import { useState } from 'react';
import {
  Card,
  CardTitle,
  CardFooter,
  Button,
  SiteConfigurationSurface,
} from '@netlify/sdk/ui/react/components';
import { trpc } from '../trpc.js';
import { WorkflowList } from '../components/WorkflowList.js';
import { WorkflowEditor } from '../components/WorkflowEditor.js';
import { RunsViewer } from '../components/RunsViewer.js';
import type { WorkflowConfig } from '../../lib/types.js';

type View = 'list' | 'create' | 'edit' | 'runs';

export function SiteConfiguration() {
  const [view, setView] = useState<View>('list');
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowConfig | null>(null);

  const handleCreate = () => {
    setSelectedWorkflow(null);
    setView('create');
  };

  const handleEdit = (workflow: WorkflowConfig) => {
    setSelectedWorkflow(workflow);
    setView('edit');
  };

  const handleViewRuns = (workflow: WorkflowConfig) => {
    setSelectedWorkflow(workflow);
    setView('runs');
  };

  const handleBack = () => {
    setSelectedWorkflow(null);
    setView('list');
  };

  const handleSaved = () => {
    setSelectedWorkflow(null);
    setView('list');
  };

  return (
    <SiteConfigurationSurface>
      <Card>
        <CardTitle>AI Workflows</CardTitle>
        {view === 'list' && (
          <>
            <p style={{ marginBottom: '1rem', color: 'var(--colorTextMuted)' }}>
              Configure AI-powered workflows for your form submissions. Each workflow
              processes form data through an AI model and saves structured output.
            </p>
            <WorkflowList
              onEdit={handleEdit}
              onViewRuns={handleViewRuns}
            />
            <CardFooter>
              <Button onClick={handleCreate}>Create Workflow</Button>
            </CardFooter>
          </>
        )}

        {(view === 'create' || view === 'edit') && (
          <WorkflowEditor
            workflow={selectedWorkflow}
            onSaved={handleSaved}
            onCancel={handleBack}
          />
        )}

        {view === 'runs' && selectedWorkflow && (
          <RunsViewer
            workflow={selectedWorkflow}
            onBack={handleBack}
          />
        )}
      </Card>
    </SiteConfigurationSurface>
  );
}
