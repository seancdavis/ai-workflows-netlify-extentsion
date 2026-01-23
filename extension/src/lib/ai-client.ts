import type { WorkflowConfig } from './types.js';

interface AIResponse {
  content: string;
}

function interpolatePrompt(prompt: string, input: Record<string, unknown>): string {
  return prompt.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = input[key];
    if (value === undefined || value === null) {
      return '';
    }
    return String(value);
  });
}

export async function callAI(
  config: WorkflowConfig,
  input: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const interpolatedPrompt = interpolatePrompt(config.prompt, input);

  const systemPrompt = `You are a data processing assistant. You will receive form submission data and must transform it according to the user's instructions.

Your response MUST be valid JSON that matches this schema:
${JSON.stringify(config.outputSchema, null, 2)}

Respond with ONLY the JSON object, no additional text or markdown formatting.`;

  const userPrompt = `Form submission data:
${JSON.stringify(input, null, 2)}

Instructions:
${interpolatedPrompt}`;

  let response: AIResponse;

  if (config.provider === 'anthropic') {
    response = await callAnthropic(config.model, systemPrompt, userPrompt);
  } else if (config.provider === 'openai') {
    response = await callOpenAI(config.model, systemPrompt, userPrompt);
  } else if (config.provider === 'google') {
    response = await callGoogle(config.model, systemPrompt, userPrompt);
  } else {
    throw new Error(`Unsupported provider: ${config.provider}`);
  }

  // Strip markdown code fences if present
  let content = response.content.trim();
  if (content.startsWith('```')) {
    // Remove opening fence (```json or ```)
    content = content.replace(/^```(?:json)?\s*\n?/, '');
    // Remove closing fence
    content = content.replace(/\n?```\s*$/, '');
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new Error(`Failed to parse AI response as JSON: ${response.content}`);
  }
}

async function callAnthropic(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<AIResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const baseUrl = process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com';

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const response = await fetch(`${baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${error}`);
  }

  const data = await response.json() as { content: Array<{ type: string; text: string }> };
  const textContent = data.content.find((c) => c.type === 'text');

  if (!textContent) {
    throw new Error('No text content in Anthropic response');
  }

  return { content: textContent.text };
}

async function callOpenAI(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<AIResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com';

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${error}`);
  }

  const data = await response.json() as { choices: Array<{ message: { content: string } }> };

  if (!data.choices?.[0]?.message?.content) {
    throw new Error('No content in OpenAI response');
  }

  return { content: data.choices[0].message.content };
}

async function callGoogle(
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<AIResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  const baseUrl = process.env.GOOGLE_GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  const response = await fetch(
    `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userPrompt }] }],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google API error: ${response.status} ${error}`);
  }

  const data = await response.json() as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No content in Google response');
  }

  return { content: text };
}
