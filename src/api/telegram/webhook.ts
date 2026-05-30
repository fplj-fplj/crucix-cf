import type { Env } from '../../types';

export default async function handleTelegramWebhook(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  return new Response('OK', { status: 200 });
}
