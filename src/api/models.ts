import type { Env } from '../types';

export default async function handleModels(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const models = [
    { id: 'anthropic:claude-3-haiku', name: 'Claude 3 Haiku', provider: 'anthropic' },
    { id: 'anthropic:claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'anthropic' },
    { id: 'openai:gpt-4o', name: 'GPT-4o', provider: 'openai' },
    { id: 'openai:gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai' },
    { id: 'gemini:gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'gemini' },
  ];

  return new Response(JSON.stringify({ status: 'ok', data: models }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
