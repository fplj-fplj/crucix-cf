import { safeFetch } from '../utils/fetch';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicResponse {
  content: { type: string; text: string }[];
  stop_reason: string;
}

interface AnthropicModelsResponse {
  data: { id: string; type: string }[];
}

export async function callAnthropic(
  apiKey: string,
  model: string,
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  const messages: AnthropicMessage[] = [{ role: 'user', content: prompt }];

  const body: Record<string, unknown> = {
    model,
    max_tokens: 4096,
    messages,
  };

  if (systemPrompt) {
    body.system = systemPrompt;
  }

  const response = await safeFetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  }, 30000);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Anthropic API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as AnthropicResponse;
  return data.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('');
}

export async function fetchAnthropicModels(apiKey: string): Promise<string[]> {
  const response = await safeFetch('https://api.anthropic.com/v1/models', {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
  }, 15000);

  if (!response.ok) {
    throw new Error(`Anthropic models API error ${response.status}`);
  }

  const data = (await response.json()) as AnthropicModelsResponse;
  return data.data.map((m) => m.id);
}
