# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Netlify Extension built with the Netlify SDK v2. It provides AI-powered form processing workflows configured through the Netlify UI.

## Commands

```bash
npm run dev          # Start extension UI dev server
npm run build        # Build the extension
npm run typecheck    # TypeScript type checking
```

## SDK v2 Critical Requirements

### Build Output Structure
The SDK generates these files in `.ntli/site/static/` that MUST NOT be overwritten:
- `manifest.json` - Contains `sdkVersion` that tells Netlify this is SDK v2
- `details.md` - Extension documentation
- `packages/buildhooks.tgz` - Build event handlers

**Vite must output to `.ntli/site/static/ui/` subdirectory** to preserve these files.

### React Version
The SDK bundles React 18.x. DO NOT install React directly as a dependency:
- Use `@types/react@18` and `@types/react-dom@18` as devDependencies only
- Configure Vite aliases to use SDK's React from `node_modules/@netlify/sdk/node_modules/react`
- Multiple React instances cause hooks errors ("can't access property useMemo")

### Extension UI Structure
- `index.html` at project ROOT (not in src/ui/)
- Vite config with `base: '/ui/'` for correct asset paths
- UI wrapped with `NetlifyExtensionUI` component from `@netlify/sdk/ui/react/components`
- Surface routing via `SurfaceRouter` and `SurfaceRoute`

### Key Config Files
- `extension.yaml` - Must have `ui.surfaces` inside `config` block
- `netlify.toml` - Must include `[[plugins]] package = "@netlify/netlify-plugin-netlify-extension"`
- `vite.config.ts` - Must alias React and output to `/ui/` subdirectory

## Architecture

### Storage Architecture

**Important**: Workflow configs are stored on the **extension's site**, not on user sites.

```
Extension Site (ai-workflows.netlify.app)
├── Blob Store: aiwf-configs
│   └── Keys: {siteId}:{workflowId}  (namespaced by user's site ID)
└── Endpoints:
    ├── /api/trpc/*  (UI uses this)
    └── /.netlify/functions/get-workflow  (injected functions call this)

User Site (where extension is installed)
├── Injected Functions:
│   ├── /_aiwf/:id  (workflow-handler.ts)
│   └── /.netlify/functions/aiwf_process-workflow-background
└── Blob Store: aiwf-runs-{siteId}:{workflowId}  (run data stored locally)
```

### Key Data Flow

1. User creates workflow via UI → tRPC saves to extension's blob store with key `{siteId}:{workflowId}`
2. Form submits to user site `/_aiwf/:id` → injected function fetches config from extension API
3. If `formName` configured → form data submitted to Netlify Forms first
4. Run record created → background function triggered
5. Background function calls AI Gateway → result saved to user site's blob store

### Function Injection

Functions in `src/functions/` are injected into user projects via `addFunctions()` in `src/index.ts`. They use the `aiwf` prefix:
- `/_aiwf/:id` (custom path via config)
- `/.netlify/functions/aiwf_process-workflow-background`

Injected functions fetch workflow config from the extension via HTTP:
```
GET https://ai-workflows.netlify.app/.netlify/functions/get-workflow?siteId={SITE_ID}&workflowId={id}
```

The extension URL can be overridden with `AIWF_EXTENSION_URL` env var.

### AI Gateway

The extension uses Netlify AI Gateway which auto-provides API keys (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GEMINI_API_KEY`) in function environments. The `src/lib/ai-client.ts` handles provider-specific API calls.

AI responses are parsed as JSON. Markdown code fences (```json) are automatically stripped before parsing.

## Key Files

| File | Purpose |
|------|---------|
| `extension.yaml` | Extension manifest, defines surfaces and scopes |
| `src/index.ts` | Extension entry, configures function injection |
| `src/server/router.ts` | tRPC procedures for CRUD operations |
| `src/lib/blob-stores.ts` | Netlify Blobs helpers with siteId key prefixing |
| `src/lib/ai-client.ts` | AI provider API calls |
| `src/endpoints/get-workflow.ts` | Public API for injected functions to fetch config |
| `src/functions/workflow-handler.ts` | Injected: handles form submissions |
| `src/functions/process-workflow-background.ts` | Injected: processes AI calls |
| `src/ui/surfaces/SiteConfiguration.tsx` | Main UI component |

## Testing

This extension requires deployment to test fully:
1. Deploy extension to Netlify
2. Publish as private extension
3. Install on a test site
4. **Redeploy the test site** to get updated injected functions
5. Submit forms to `/_aiwf/{workflow-id}`

## Conventions

- TypeScript strict mode enabled
- ESM modules (`"type": "module"` in package.json)
- File extensions required in imports (`.js` for TypeScript files)
- tRPC for UI-to-backend communication
- Netlify Blobs for persistent storage (extension site for configs, user site for runs)

## Common Issues

### "Workflow not found" error
- The injected functions fetch config from the extension site
- Make sure the extension is deployed with the latest code
- Make sure the user site is redeployed after extension updates
- Check that `SITE_ID` env var is available (auto-provided by Netlify)

### Workflows showing on all sites
- Configs are namespaced by siteId in blob keys
- If siteId is missing from context, data won't be scoped correctly

### AI response parsing fails
- AI sometimes returns markdown-fenced JSON (```json ... ```)
- The ai-client.ts strips these fences automatically
- Check function logs for the raw response if issues persist
