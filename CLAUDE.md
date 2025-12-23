# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Netlify Extension built with the Netlify SDK. It provides AI-powered form processing workflows configured through the Netlify UI.

## Commands

```bash
npm run dev          # Start extension UI dev server
npm run build        # Build the extension
npm run typecheck    # TypeScript type checking
```

## Architecture

### Extension Structure

- **Netlify SDK Extension**: Uses `@netlify/sdk` for extension configuration and function injection
- **tRPC**: Type-safe API layer between UI and serverless endpoints
- **React UI**: Rendered in Netlify dashboard via extension surfaces

### Key Data Flow

1. User creates workflow config via UI → stored in `aiwf-configs` blob store
2. Form submits to `/_aiwf/:id` → `workflow-handler.ts` validates and creates run
3. Background function triggered → `process-workflow-background.ts` calls AI Gateway
4. Result saved to `aiwf-runs-{workflowId}` blob store

### Function Injection

Functions in `src/functions/` are injected into user projects via `addFunctions()` in `src/index.ts`. They use the `aiwf` prefix, so paths become:
- `/_aiwf/:id` (custom path via config)
- `/.netlify/functions/aiwf_process-workflow-background`

### AI Gateway

The extension uses Netlify AI Gateway which auto-provides API keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`) in function environments. The `src/lib/ai-client.ts` handles provider-specific API calls.

## Key Files

| File | Purpose |
|------|---------|
| `extension.yaml` | Extension manifest, defines surfaces and scopes |
| `src/index.ts` | Extension entry, configures function injection |
| `src/server/router.ts` | tRPC procedures for CRUD operations |
| `src/lib/blob-stores.ts` | Netlify Blobs read/write helpers |
| `src/lib/ai-client.ts` | AI provider API calls |
| `src/ui/surfaces/SiteConfiguration.tsx` | Main UI component |

## Testing

This extension requires deployment to test fully:
1. Deploy extension to Netlify
2. Publish as private extension
3. Install on a test site
4. Run `netlify dev` in test site to inject functions locally

## Conventions

- TypeScript strict mode enabled
- ESM modules (`"type": "module"` in package.json)
- File extensions required in imports (`.js` for TypeScript files)
- tRPC for all UI-to-backend communication
- Netlify Blobs for all persistent storage
