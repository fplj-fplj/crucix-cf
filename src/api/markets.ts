import type { Env } from '../types';

export default async function handleMarkets(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  return new Response(JSON.stringify({ status: 'ok', data: {} }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
