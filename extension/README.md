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
Form POST → /_aiwf/:id
    ↓
Serverless Function (validates, queues run)
    ↓
Background Function (calls AI Gateway, saves output)
    ↓
Netlify Blobs (stores runs and results)
```

## Features

- **Multiple AI Providers**: Anthropic (Claude), OpenAI (GPT), Google (Gemini) via Netlify AI Gateway
- **Structured Output**: Define the exact JSON schema you want returned
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

### Testing Locally

1. Deploy and publish extension as private to your team (one-time)
2. Create a test project and install the extension
3. Run `netlify dev` in the test project to inject functions
4. Submit forms to `http://localhost:8888/_aiwf/{workflow-id}`

## Form Integration

```html
<form action="/_aiwf/your-workflow-id" method="POST">
  <input type="text" name="name" placeholder="Your name" />
  <input type="email" name="email" placeholder="Your email" />
  <textarea name="message" placeholder="Your message"></textarea>
  <button type="submit">Submit</button>
</form>
```

## Accessing Output Data

Workflow outputs are stored in Netlify Blobs:

```javascript
import { getStore } from '@netlify/blobs';

// Get all runs for a workflow
const store = getStore('aiwf-runs-{workflow-id}');
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
│   ├── workflow-handler.ts  # Form submission handler (/_aiwf/:id)
│   └── process-workflow-background.ts  # AI processing
├── endpoints/
│   └── trpc.ts              # tRPC API endpoint
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

## License

MIT
