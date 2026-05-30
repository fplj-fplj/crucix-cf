import type { Env } from './types';
import handleHealth from './api/health';
import handleSettings from './api/settings';
import handleBriefing from './api/briefing';
import handleSweep from './api/sweep';
import handleDelta from './api/delta';
import handleMarkets from './api/markets';
import handleModels from './api/models';
import handleTranslate from './api/translate';
import handleTelegramWebhook from './api/telegram/webhook';
import handleTelegramRegister from './api/telegram/register';
import handleDiscordInteraction from './api/discord/interaction';
import handleDiscordRegister from './api/discord/register';
import { runScheduledSweep } from './workers/cron-sweep';

function getContentType(path: string): string {
  if (path.endsWith('.html')) return 'text/html; charset=utf-8';
  if (path.endsWith('.css')) return 'text/css; charset=utf-8';
  if (path.endsWith('.js') || path.endsWith('.mjs')) return 'application/javascript; charset=utf-8';
  if (path.endsWith('.json')) return 'application/json; charset=utf-8';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.gif')) return 'image/gif';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  if (path.endsWith('.ico')) return 'image/x-icon';
  return 'application/octet-stream';
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 处理 API 请求
    if (url.pathname.startsWith('/api/')) {
      const path = url.pathname;
      
      if (path === '/api/health') {
        return handleHealth(request, env, ctx);
      }
      if (path === '/api/settings') {
        return handleSettings(request, env, ctx);
      }
      if (path === '/api/briefing') {
        return handleBriefing(request, env, ctx);
      }
      if (path === '/api/sweep') {
        return handleSweep(request, env, ctx);
      }
      if (path === '/api/delta') {
        return handleDelta(request, env, ctx);
      }
      if (path === '/api/markets') {
        return handleMarkets(request, env, ctx);
      }
      if (path === '/api/models') {
        return handleModels(request, env, ctx);
      }
      if (path === '/api/translate') {
        return handleTranslate(request, env, ctx);
      }
      if (path === '/api/telegram/webhook') {
        return handleTelegramWebhook(request, env, ctx);
      }
      if (path === '/api/telegram/register') {
        return handleTelegramRegister(request, env, ctx);
      }
      if (path === '/api/discord/interaction') {
        return handleDiscordInteraction(request, env, ctx);
      }
      if (path === '/api/discord/register') {
        return handleDiscordRegister(request, env, ctx);
      }

      return new Response('Not Found', { status: 404 });
    }

    // 处理静态文件请求
    // 使用环境变量中的 ASSETS（Wrangler 会自动注入）
    let filePath = url.pathname;
    if (filePath === '/') {
      filePath = '/index.html';
    }

    const assetRequest = new Request(new URL(filePath, request.url), request);
    
    if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(assetRequest);
      if (assetResponse && assetResponse.status !== 404) {
        return assetResponse;
      }
    }

    // 如果 Assets 失败，返回默认响应
    return new Response('Service is running', { status: 200 });
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runScheduledSweep(env, ctx));
  },
};
