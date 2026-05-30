import type { Alert, Settings } from '../../types';
import { AlertTier } from '../../types';
import { getSweepStatus, getBriefing } from '../kv';
import { getAlertHistory } from '../alerts/history';
import { runSweep } from '../sweep/orchestrator';

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
}

export interface DiscordInteractionResponse {
  type: 4;
  data: {
    content?: string;
    embeds?: DiscordEmbed[];
  };
}

export async function handleDiscordCommand(
  command: string,
  kv: KVNamespace,
  config: Settings,
): Promise<DiscordInteractionResponse> {
  switch (command) {
    case 'status': {
      const status = await getSweepStatus(kv);
      if (!status) {
        return { type: 4, data: { content: 'No sweep status available.' } };
      }
      return {
        type: 4,
        data: {
          embeds: [
            {
              title: 'System Status',
              color: status.healthySources === status.sourceCount ? 0x00ff00 : 0xffaa00,
              fields: [
                { name: 'Healthy Sources', value: `${status.healthySources}/${status.sourceCount}`, inline: true },
                { name: 'Last Sweep', value: status.lastSweep, inline: true },
                { name: 'Next Sweep', value: status.nextSweep, inline: true },
                { name: 'Sweeping', value: status.isSweeping ? 'Yes' : 'No', inline: true },
                { name: 'LLM', value: `${config.llm.provider} (${config.llm.model})`, inline: true },
              ],
              timestamp: new Date().toISOString(),
            },
          ],
        },
      };
    }
    case 'sweep': {
      try {
        await runSweep(config);
        return { type: 4, data: { content: '✅ Sweep triggered successfully.' } };
      } catch {
        return { type: 4, data: { content: '❌ Sweep failed. Check logs for details.' } };
      }
    }
    case 'brief': {
      const briefing = await getBriefing(kv);
      if (!briefing) {
        return { type: 4, data: { content: 'No briefing available yet.' } };
      }
      const fields: { name: string; value: string; inline?: boolean }[] = [];
      if (briefing.sweepDelta) {
        if (briefing.sweepDelta.overallStatus) {
          fields.push({ name: 'Status', value: briefing.sweepDelta.overallStatus, inline: true });
        }
        if (briefing.sweepDelta.entries) {
          fields.push({ name: 'Delta Entries', value: String(briefing.sweepDelta.entries.length), inline: true });
        }
      }
      if (briefing.crossSignals) {
        fields.push({ name: 'Cross-Signals', value: String(briefing.crossSignals.length), inline: true });
      }
      if (briefing.newsTicker) {
        fields.push({ name: 'News', value: String(briefing.newsTicker.length), inline: true });
      }
      if (briefing.osintFeed) {
        fields.push({ name: 'OSINT', value: String(briefing.osintFeed.length), inline: true });
      }
      return {
        type: 4,
        data: {
          embeds: [
            {
              title: `Briefing — ${briefing.region || 'Global'}`,
              description: briefing.sweepDelta?.summary || '',
              color: 0x0088ff,
              fields,
              footer: { text: briefing.timestamp },
              timestamp: briefing.timestamp,
            },
          ],
        },
      };
    }
    case 'alerts': {
      const alerts = await getAlertHistory(kv, 10);
      if (alerts.length === 0) {
        return { type: 4, data: { content: 'No alerts recorded.' } };
      }
      return {
        type: 4,
        data: {
          embeds: alerts.slice(0, 5).map(createAlertEmbed),
        },
      };
    }
    default:
      return { type: 4, data: { content: `Unknown command: ${command}` } };
  }
}

export function createAlertEmbed(alert: Alert): DiscordEmbed {
  const colorMap: Record<string, number> = {
    [AlertTier.FLASH]: 0xff0000,
    [AlertTier.PRIORITY]: 0xffaa00,
    [AlertTier.ROUTINE]: 0x0088ff,
  };
  const fields: { name: string; value: string; inline?: boolean }[] = [];
  if (alert.confidence !== undefined) {
    fields.push({ name: 'Confidence', value: `${alert.confidence}%`, inline: true });
  }
  if (alert.sources && alert.sources.length > 0) {
    fields.push({ name: 'Sources', value: alert.sources.join(', '), inline: true });
  }
  if (alert.correlations && alert.correlations.length > 0) {
    fields.push({ name: 'Correlations', value: alert.correlations.join(', '), inline: false });
  }
  return {
    title: `[${alert.tier}] ${alert.title}`,
    description: alert.description,
    color: colorMap[alert.tier] ?? 0x888888,
    fields,
    footer: { text: alert.timestamp },
    timestamp: alert.timestamp,
  };
}
