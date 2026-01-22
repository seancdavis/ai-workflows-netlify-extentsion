# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a minimal Astro demo site configured for deployment on Netlify with Tailwind CSS v4 for styling.

## Commands

```bash
npm run dev      # Start local dev server at localhost:4321
npm run build    # Build production site to ./dist/
npm run preview  # Preview production build locally
```

## Tech Stack

- **Astro**: Static site generator with file-based routing in `src/pages/`
- **Tailwind CSS v4**: Imported via `@import "tailwindcss"` in `src/styles/global.css`
- **Netlify Adapter**: `@astrojs/netlify` for serverless deployment

## Key Configuration

- `astro.config.mjs`: Configures Vite with Tailwind plugin and Netlify adapter
- Tailwind is integrated via Vite plugin (`@tailwindcss/vite`), not PostCSS
