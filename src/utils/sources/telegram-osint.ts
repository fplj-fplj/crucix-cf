import { safeFetchJSON } from '../utils/fetch';
import type { SourceResult } from "../../types";

const DEFAULT_CHANNELS = [
  '@warmonitors',
  '@intelcrab',
  '@sentdefender',
  '@OSINTtechnical',
  '@Liveuamap',
  '@WarMonitor3',
  '@MiddleEastEye',
  '@Aldin_ww',
  '@nexta_tv',
  '@flash_news_ua',
  '@UkrainianIntel',
  '@milinfolive',
  '@rybar_en',
  '@balkan_osint',
  '@Cen4infoRes',
  '@shishint',
  '@infomil_ru',
];

const URGENCY_KEYWORDS = [
  'breaking', 'urgent', 'flash', 'alert', 'critical',
  'missile', 'nuclear', 'strike', 'explosion', 'attack',
  'invasion', 'war', 'combat', 'casualty', 'evacuation',
  'emergency', 'threat', 'launch', 'detonation', 'shooting',
  'bombardment', 'offensive', 'retaliation', 'escalation',
];

function assessUrgency(text: string): 'critical' | 'high' | 'medium' | 'low' {
  const lower = text.toLowerCase();
  let score = 0;
  for (const kw of URGENCY_KEYWORDS) {
    if (lower.includes(kw)) score++;
  }
  if (score >= 3 || lower.includes('breaking') || lower.includes('flash')) return 'critical';
  if (score >= 2 || lower.includes('urgent')) return 'high';
  if (score >= 1) return 'medium';
  return 'low';
}

function extractTags(text: string): string[] {
  const tags: string[] = [];
  const hashtagRegex = /#([a-zA-Z0-9_]+)/g;
  let match;
  while ((match = hashtagRegex.exec(text)) !== null) {
    tags.push(match[1]);
  }
  return tags.slice(0, 10);
}

export async function fetchTelegramOsintData(botToken: string, channels?: string): Promise<SourceResult> {
  if (!botToken) {
    return { name: 'telegram-osint', source: 'telegram-osint', success: false, error: 'API key not configured', timestamp: new Date().toISOString() };
  }

  try {
    const channelList = channels
      ? channels.split(',').map((c) => c.trim()).filter(Boolean)
      : DEFAULT_CHANNELS;

    const updatesResult = await safeFetchJSON<any>(
      `https://api.telegram.org/bot${botToken}/getUpdates?limit=100&timeout=0`,
      undefined,
      10_000,
    );

    const posts: any[] = [];
    const channelInfoMap = new Map<string, { id: string; name: string; subscriberCount: number }>();

    const updates = updatesResult.result ?? updatesResult;
    if (Array.isArray(updates)) {
      for (const update of updates.slice(0, 100)) {
        const msg = update.message ?? update.channel_post ?? update.edited_channel_post;
        if (!msg) continue;

        const chatId = String(msg.chat?.id ?? '');
        const chatTitle = msg.chat?.title ?? msg.chat?.username ?? '';
        const text = msg.text ?? msg.caption ?? '';
        const date = (msg.date ?? 0) * 1000;
        const views = msg.views ?? 0;
        const forwards = msg.forward_count ?? 0;

        posts.push({
          channel: chatTitle || chatId,
          content: text.slice(0, 2000),
          date,
          views,
          forwards,
          tags: extractTags(text),
          urgency: assessUrgency(text),
        });

        if (!channelInfoMap.has(chatId)) {
          channelInfoMap.set(chatId, {
            id: chatId,
            name: chatTitle,
            subscriberCount: msg.chat?.member_count ?? 0,
          });
        }
      }
    }

    const chatPromises = channelList.slice(0, 17).map((ch) =>
      safeFetchJSON<any>(
        `https://api.telegram.org/bot${botToken}/getChat?chat_id=${encodeURIComponent(ch)}`,
        undefined,
        8_000,
      ).catch(() => null),
    );

    const chatResults = await Promise.all(chatPromises);
    for (let i = 0; i < chatResults.length; i++) {
      const chat = chatResults[i];
      if (chat) {
        const chatData = chat.result ?? chat;
        const chatId = String(chatData.id ?? '');
        channelInfoMap.set(chatId, {
          id: chatId,
          name: chatData.title ?? chatData.username ?? chatData.first_name ?? channelList[i],
          subscriberCount: chatData.member_count ?? 0,
        });
      }
    }

    const urgentCount = posts.filter(
      (p) => p.urgency === 'critical' || p.urgency === 'high',
    ).length;

    const channelsData = Array.from(channelInfoMap.values());

    return {
      name: 'telegram-osint', source: 'telegram-osint',
      success: true,
      data: { posts, urgentCount, channels: channelsData },
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      name: 'telegram-osint', source: 'telegram-osint',
      success: false,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    };
  }
}
