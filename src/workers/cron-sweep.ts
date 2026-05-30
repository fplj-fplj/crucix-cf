import type { Env, Alert, Settings, SourceResult, DeltaData } from '../types';
import {
  getSettings,
  getBriefing,
  setBriefing,
  setDelta,
  setSweepStatus,
  getSweepStatus,
  addAlertsToHistory,
} from '../utils/kv';
import { runSweep, computeDelta } from '../utils/sweep/orchestrator';
import { classifyAlerts } from '../utils/alerts/classifier';
import { deduplicateAlerts } from '../utils/alerts/dedup';
import { sendTelegramAlert } from '../utils/bots/telegram';
import { sendDiscordWebhookAlert } from '../utils/bots/discord-webhook';

export async function runScheduledSweep(env: Env, ctx?: ExecutionContext): Promise<void> {
  const config = await getSettings(env.CONFIG_KV, env);
  if (!config) return;

  const previousBriefing = await getBriefing(env.BRIEFING_KV);
  const previousStatus = await getSweepStatus(env.BRIEFING_KV);

  await setSweepStatus(env.BRIEFING_KV, {
    lastSweep: previousStatus?.lastSweep ?? new Date().toISOString(),
    nextSweep: previousStatus?.nextSweep ?? new Date().toISOString(),
    sourceCount: previousStatus?.sourceCount ?? 0,
    healthySources: previousStatus?.healthySources ?? 0,
    isSweeping: true,
  });

  let sourceResults: SourceResult[];
  let briefing: any;
  try {
    const sweepResult = await runSweep(config);
    briefing = sweepResult.briefing;
    sourceResults = sweepResult.sourceResults;
  } catch {
    const status = await getSweepStatus(env.BRIEFING_KV);
    await setSweepStatus(env.BRIEFING_KV, {
      lastSweep: status?.lastSweep ?? new Date().toISOString(),
      nextSweep: status?.nextSweep ?? new Date().toISOString(),
      sourceCount: status?.sourceCount ?? 0,
      healthySources: status?.healthySources ?? 0,
      isSweeping: false,
    });
    return;
  }

  const delta: DeltaData = computeDelta(briefing, previousBriefing);
  briefing.sweepDelta = delta;
  
  await setBriefing(env.BRIEFING_KV, briefing);
  await setDelta(env.BRIEFING_KV, delta);

  let alerts = await classifyAlerts(delta, briefing, config.llm);
  alerts = deduplicateAlerts(alerts);

  if (alerts.length > 0) {
    await addAlertsToHistory(env.BRIEFING_KV, alerts);
  }

  const now = new Date().toISOString();
  const nextSweep = new Date(Date.now() + config.sweep.intervalMinutes * 60 * 1000).toISOString();
  const healthySources = sourceResults.filter((r) => r.success).length;
  await setSweepStatus(env.BRIEFING_KV, {
    lastSweep: now,
    nextSweep,
    sourceCount: sourceResults.length,
    healthySources,
    isSweeping: false,
  });

  for (const alert of alerts) {
    if (ctx) {
      ctx.waitUntil(pushAlert(config, alert, env.BRIEFING_KV));
    } else {
      await pushAlert(config, alert, env.BRIEFING_KV);
    }
  }
}

async function pushAlert(
  config: Settings,
  alert: Alert,
  kv: KVNamespace,
): Promise<void> {
  const promises: Promise<void>[] = [];
  if (config.bots?.telegram?.enabled && config.bots.telegram.botToken && config.bots.telegram.chatId) {
    promises.push(sendTelegramAlert(config.bots.telegram.botToken, config.bots.telegram.chatId, alert, kv));
  }
  if (config.bots?.discord?.enabled && config.bots.discord.webhookUrl) {
    promises.push(sendDiscordWebhookAlert(config.bots.discord.webhookUrl, alert));
  }
  await Promise.allSettled(promises);
}
