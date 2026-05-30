import { safeFetch } from '../utils/fetch';

interface OpenAIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIChatResponse {
  choices: { message: { content: string }; finish_reason: string }[];
}

interface OpenAIModelsResponse {
  data: { id: string; object: string }[];
}

export async function callOpenAI(
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  const messages: OpenAIChatMessage[] = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({ role: 'user', content: prompt });

  const response = await safeFetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages,
    }),
  }, 30000);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as OpenAIChatResponse;
  return data.choices[0]?.message?.content ?? '';
}

export async function fetchOpenAIModels(apiKey: string): Promise<string[]> {
  const response = await safeFetch('https://api.openai.com/v1/models', {
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  }, 15000);

  if (!response.ok) {
    throw new Error(`OpenAI models API error ${response.status}`);
  }

  const data = (await response.json()) as OpenAIModelsResponse;
  return data.data.map((m) => m.id);
}
