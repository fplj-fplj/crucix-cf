import type { Alert, Settings } from '../../types';
import { AlertTier } from '../../types';
import { getSweepStatus, getBriefing } from '../kv';
import { getAlertHistory } from '../alerts/history';
import { runSweep } from '../sweep/orchestrator';

export async function handleTelegramCommand(
  command: string,
  args: string,
  kv: KVNamespace,
  config: Settings,
): Promise<string> {
  switch (command) {
    case '/status': {
      const status = await getSweepStatus(kv);
      if (!status) return 'No sweep status available.';
      return [
        `System Health: ${status.healthySources}/${status.sourceCount} sources healthy`,
        `Last Sweep: ${status.lastSweep}`,
        `Next Sweep: ${status.nextSweep}`,
        `Currently Sweeping: ${status.isSweeping ? 'Yes' : 'No'}`,
        `LLM: ${config.llm.provider} (${config.llm.model})`,
      ].join('\n');
    }
    case '/sweep': {
      try {
        await runSweep(config);
        return 'Sweep triggered successfully.';
      } catch {
        return 'Sweep failed. Check logs for details.';
      }
    }
    case '/brief': {
      const briefing = await getBriefing(kv);
      if (!briefing) return 'No briefing available yet.';
      const lines = [`Briefing — ${briefing.timestamp}`];
      if (briefing.region) lines.push(`Region: ${briefing.region}`);
      if (briefing.sweepDelta) {
        if (briefing.sweepDelta.overallStatus) {
          lines.push(`Status: ${briefing.sweepDelta.overallStatus}`);
        }
        if (briefing.sweepDelta.entries) {
          lines.push(`Alerts: ${briefing.sweepDelta.entries.length} delta entries`);
        }
      }
      if (briefing.crossSignals) {
        lines.push(`Signals: ${briefing.crossSignals.length} cross-signals`);
      }
      if (briefing.newsTicker) {
        lines.push(`News: ${briefing.newsTicker.length} items`);
      }
      if (briefing.osintFeed) {
        lines.push(`OSINT: ${briefing.osintFeed.length} posts`);
      }
      return lines.join('\n');
    }
    case '/alerts': {
      const alerts = await getAlertHistory(kv, 10);
      if (alerts.length === 0) return 'No alerts recorded.';
      return alerts
        .map((a) => `[${a.tier}] ${a.title}\n${a.description}\n${a.timestamp}`)
        .join('\n\n');
    }
    case '/mute': {
      const duration = parseDuration(args || '1h');
      const until = Date.now() + duration;
      await kv.put('telegram:muted', JSON.stringify({ muted: true, until }));
      const mins = Math.round(duration / 60000);
      return `Muted for ${mins} minutes (until ${new Date(until).toISOString()}).`;
    }
    case '/unmute': {
      await kv.put('telegram:muted', JSON.stringify({ muted: false, until: 0 }));
      return 'Unmuted. Alerts will be sent normally.';
    }
    case '/help': {
      return [
        '/status — System health & last sweep info',
        '/sweep — Trigger a manual sweep',
        '/brief — Latest briefing summary',
        '/alerts — Recent alert history',
        '/mute [duration] — Mute alerts (e.g. 30m, 1h, 2d)',
        '/unmute — Unmute alerts',
        '/help — Show this message',
      ].join('\n');
    }
    default:
      return `Unknown command: ${command}. Type /help for available commands.`;
  }
}

function parseDuration(input: string): number {
  const match = input.match(/^(\d+)(m|h|d)$/);
  if (!match) return 3600000;
  const value = parseInt(match[1], 10);
  switch (match[2]) {
    case 'm': return value * 60000;
    case 'h': return value * 3600000;
    case 'd': return value * 86400000;
    default: return 3600000;
  }
}

export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
): Promise<void> {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}

function tierEmoji(tier: string): string {
  switch (tier) {
    case AlertTier.FLASH: return '🔴';
    case AlertTier.PRIORITY: return '🟠';
    case AlertTier.ROUTINE: return '🔵';
    default: return '⚪';
  }
}

export async function sendTelegramAlert(
  botToken: string,
  chatId: string,
  alert: Alert,
  kv: KVNamespace,
): Promise<void> {
  const raw = await kv.get('telegram:muted', { type: 'text' });
  if (raw) {
    const muted = JSON.parse(raw) as { muted: boolean; until: number };
    if (muted.muted && Date.now() < muted.until) return;
  }
  const emoji = tierEmoji(alert.tier);
  const lines = [
    `${emoji} <b>[${alert.tier}] ${alert.title}</b>`,
    alert.description,
  ];
  if (alert.confidence !== undefined) {
    lines.push(`Confidence: ${alert.confidence}%`);
  }
  if (alert.sources && alert.sources.length > 0) {
    lines.push(`Sources: ${alert.sources.join(', ')}`);
  }
  lines.push(`Time: ${alert.timestamp}`);
  if (alert.correlations && alert.correlations.length > 0) {
    lines.push(`Correlations: ${alert.correlations.join(', ')}`);
  }
  await sendTelegramMessage(botToken, chatId, lines.join('\n'));
}
