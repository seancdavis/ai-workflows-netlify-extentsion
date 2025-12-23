# AI Workflows

Configure AI-powered workflows for your form submissions without writing code.

## Overview

AI Workflows allows you to create automated pipelines that process form submissions through AI models and save structured output to Netlify Blobs. Perfect for:

- Lead qualification from contact forms
- Content categorization and summarization
- Sentiment analysis
- Data extraction and normalization

## How It Works

1. **Create a Workflow**: Define your input fields, AI prompt, and expected output structure
2. **Point Your Form**: Update your form's action URL to `/_aiwf/{workflow-id}`
3. **View Results**: Monitor runs and outputs in the extension UI

## Features

- **Multiple AI Providers**: Choose from Anthropic (Claude), OpenAI (GPT), or Google (Gemini)
- **Structured Output**: Define exactly what fields you want the AI to return
- **Run History**: Track all form submissions and their processing status
- **Manual Retry**: Retry failed runs with one click
- **No Code Required**: Configure everything through the UI

## Form Integration

Point your HTML form to the workflow endpoint:

```html
<form action="/_aiwf/your-workflow-id" method="POST">
  <input type="text" name="name" placeholder="Your name" />
  <input type="email" name="email" placeholder="Your email" />
  <textarea name="message" placeholder="Your message"></textarea>
  <button type="submit">Submit</button>
</form>
```

## Output Access

Workflow outputs are stored in Netlify Blobs and can be accessed programmatically:

```javascript
import { getStore } from '@netlify/blobs';

const store = getStore('aiwf-runs-{workflow-id}');
const runs = await store.list();
```

## Pricing

This extension uses the Netlify AI Gateway for AI inference. Usage is billed through your Netlify account at standard AI Gateway rates.
