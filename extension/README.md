# AI Workflows for Netlify

A Netlify Extension that allows users to configure AI-powered workflows for form submissions without writing code.

## Overview

AI Workflows processes form submissions through AI models and saves structured output to Netlify Blobs. Use cases include:

- Lead qualification from contact forms
- Content categorization and summarization
- Sentiment analysis
- Data extraction and normalization

## How It Works

1. **Create a Workflow**: Define input fields, AI prompt, and expected output structure via the Netlify UI
2. **Point Your Form**: Update your form's action URL to `/_aiwf/{workflow-id}`
3. **View Results**: Monitor runs and outputs in the extension UI

## Architecture

```
User Site                              Extension Site
┌─────────────────────────┐           ┌─────────────────────────────┐
│ Form POST → /_aiwf/:id  │           │ Blob Store: aiwf-configs    │
│         ↓               │    GET    │   Keys: {siteId}:{id}       │
│ Injected Function ──────┼──────────→│                             │
│         ↓               │           │ /.netlify/functions/        │
│ Netlify Forms (optional)│           │   get-workflow              │
│         ↓               │           └─────────────────────────────┘
│ Background Function     │
│         ↓               │
│ AI Gateway              │
│         ↓               │
│ Blob Store: aiwf-runs   │
└─────────────────────────┘
```

Workflow configs are stored on the extension's site and fetched via API. This allows the extension UI to manage configs while injected functions on user sites can access them.

## Features

- **Multiple AI Providers**: Anthropic (Claude), OpenAI (GPT), Google (Gemini) via Netlify AI Gateway
- **Structured Output**: Define the exact JSON schema you want returned
- **Netlify Forms Integration**: Optionally submit to Netlify Forms as backup
- **Run History**: Track all submissions and their processing status
- **Manual Retry**: Retry failed runs with one click
- **No Code Required**: Configure everything through the UI

## Development

### Prerequisites

- Node.js 20.12.2+
- Netlify CLI (`npm install -g netlify-cli`)

### Setup

```bash
npm install
```

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start extension UI dev server |
| `npm run build` | Build the extension |
| `npm run typecheck` | Run TypeScript type checking |

### SDK v2 Notes

This extension uses Netlify SDK v2. Key requirements:

- **React**: Do NOT install React directly. The SDK bundles React 18.x. Only install `@types/react@18` as devDependency.
- **Vite Output**: Must output to `.ntli/site/static/ui/` to preserve SDK-generated `manifest.json`
- **index.html**: Must be at project root, not in `src/ui/`
- **Extension Registration**: Create via Team → Extensions → Create an extension (not the old integration flow)

See `CLAUDE.md` for detailed technical requirements.

### Testing

1. Deploy and publish extension as private to your team
2. Create a test project and install the extension
3. Configure a workflow in the extension UI
4. **Important**: Redeploy the test site after extension updates to get new injected functions
5. Submit forms to `/_aiwf/{workflow-id}`

## Form Integration

### Basic Form

```html
<form action="/_aiwf/your-workflow-id" method="POST">
  <input type="text" name="name" placeholder="Your name" />
  <input type="email" name="email" placeholder="Your email" />
  <textarea name="message" placeholder="Your message"></textarea>
  <button type="submit">Submit</button>
</form>
```

### With Netlify Forms Backup

To also capture submissions in Netlify Forms:

1. Add `name` and `data-netlify="true"` to your form for Netlify detection
2. Set the `formName` field in your workflow config to match the form name
3. The extension will submit to Netlify Forms before AI processing

```html
<form name="contact" data-netlify="true" action="/_aiwf/your-workflow-id" method="POST">
  <!-- form fields -->
</form>
```

## Accessing Output Data

Workflow outputs are stored in Netlify Blobs on the user's site:

```javascript
import { getStore } from '@netlify/blobs';

// Get all runs for a workflow
const store = getStore(`aiwf-runs-${workflowId}`);
const { blobs } = await store.list();

for (const blob of blobs) {
  const run = await store.get(blob.key, { type: 'json' });
  console.log(run.output);
}
```

## Project Structure

```
src/
├── index.ts                 # Extension entry, function injection
├── functions/
│   ├── workflow-handler.ts  # Injected: form handler (/_aiwf/:id)
│   └── process-workflow-background.ts  # Injected: AI processing
├── endpoints/
│   ├── trpc.ts              # tRPC API endpoint
│   └── get-workflow.ts      # Public API for fetching workflow configs
├── server/
│   ├── trpc.ts              # tRPC setup
│   └── router.ts            # API procedures
├── ui/
│   ├── App.tsx              # Main app with providers
│   ├── surfaces/
│   │   └── SiteConfiguration.tsx  # Main UI
│   └── components/
│       ├── WorkflowList.tsx
│       ├── WorkflowEditor.tsx
│       └── RunsViewer.tsx
└── lib/
    ├── types.ts             # TypeScript interfaces
    ├── blob-stores.ts       # Netlify Blobs helpers
    └── ai-client.ts         # AI Gateway client
```

## Environment Variables

### On User Sites (Auto-provided)

- `SITE_ID` - Used to scope workflow configs
- `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY` - Provided by AI Gateway

### Optional Override

- `AIWF_EXTENSION_URL` - Override extension URL (default: `https://ai-workflows.netlify.app`)

## License

MIT
