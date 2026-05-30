import type { Env } from '../../types';

export default async function handleDiscordInteraction(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  return new Response(JSON.stringify({ type: 1 }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
