import { LLMConfig, BriefingData, TradeIdea } from "../../types";
import { callLLM } from './provider';

const SYSTEM_PROMPT = `You are a quantitative analyst specializing in cross-domain intelligence analysis. Based on multi-source intelligence data including market data, risk indicators, OSINT signals, and conflict events, generate actionable trade ideas.

For each trade idea, provide:
- direction: "long", "short", or "hedge"
- asset: specific ticker or asset name
- timeframe: expected holding period
- confidence: 0-100 score
- rationale: brief explanation linking cross-domain signals
- risk: key risk factor

Respond with a JSON array of trade ideas. No other text.`;

function buildBriefingSummary(briefing: BriefingData): string {
  const parts: string[] = [];

  parts.push(`Region: ${briefing.region || 'global'}`);
  parts.push(`Timestamp: ${briefing.timestamp}`);
  if (briefing.sweepDelta && briefing.sweepDelta.overallStatus) {
    parts.push(`Overall Delta Status: ${briefing.sweepDelta.overallStatus}`);
  }

  if (briefing.markets && briefing.markets.length > 0) {
    const marketItems = briefing.markets
      .flatMap((m) => m.items || [])
      .slice(0, 10)
      .filter((i) => i && i.name && i.value !== undefined)
      .map((i) => `${i.name}: ${i.value} (${i.changePercent >= 0 ? '+' : ''}${i.changePercent}%)`)
      .join('; ');
    if (marketItems) parts.push(`Markets: ${marketItems}`);
  }

  if (briefing.riskGauges && briefing.riskGauges.length > 0) {
    const gauges = briefing.riskGauges
      .filter((g) => g && g.name && g.value !== undefined)
      .map((g) => `${g.name}: ${g.value}${g.unit || ''} (trend: ${g.trend || 'stable'})`)
      .join('; ');
    if (gauges) parts.push(`Risk Gauges: ${gauges}`);
  }

  if (briefing.osintFeed && briefing.osintFeed.length > 0) {
    const posts = briefing.osintFeed
      .slice(0, 5)
      .filter((p) => p && p.content)
      .map((p) => `[${p.urgency || 'low'}] ${p.channel || 'unknown'}: ${p.content}`)
      .join('; ');
    if (posts) parts.push(`OSINT: ${posts}`);
  }

  if (briefing.newsTicker && briefing.newsTicker.length > 0) {
    const news = briefing.newsTicker
      .slice(0, 5)
      .filter((n) => n && n.title)
      .map((n) => `${n.title} (${n.category || 'general'})`)
      .join('; ');
    if (news) parts.push(`News: ${news}`);
  }

  if (briefing.nuclearWatch && briefing.nuclearWatch.length > 0) {
    const nuclear = briefing.nuclearWatch
      .filter((n) => n && n.name && n.status !== 'normal')
      .map((n) => `${n.name}: ${n.cpm} CPM (${n.status})`)
      .join('; ');
    if (nuclear) parts.push(`Nuclear Alerts: ${nuclear}`);
  }

  if (briefing.crossSignals && briefing.crossSignals.length > 0) {
    const signals = briefing.crossSignals
      .filter((s) => s && s.domain)
      .map((s) => `${s.domain}: ${(s.signals || []).join(', ')} (severity: ${s.severity || 'low'}, correlation: ${s.correlation || 0})`)
      .join('; ');
    if (signals) parts.push(`Cross Signals: ${signals}`);
  }

  if (briefing.sweepDelta && briefing.sweepDelta.entries && briefing.sweepDelta.entries.length > 0) {
    const deltas = briefing.sweepDelta.entries
      .slice(0, 10)
      .filter((d) => d && d.description)
      .map((d) => `[${d.severity || 'low'}] ${d.type || 'change'} from ${d.source || 'unknown'}: ${d.description}`)
      .join('; ');
    if (deltas) parts.push(`Delta Changes: ${deltas}`);
  }

  return parts.join('\n\n');
}

function generateFallbackIdeas(briefing: BriefingData): TradeIdea[] {
  const ideas: TradeIdea[] = [];

  if (briefing.markets && briefing.markets.length > 0) {
    const vixItem = briefing.markets
      .flatMap((m) => m.items || [])
      .find((i) => i && i.name && i.name.toLowerCase().includes('vix'));

    if (vixItem && vixItem.value > 25) {
      ideas.push({
        direction: 'hedge',
        asset: 'SPY',
        timeframe: '1-2 weeks',
        confidence: 60,
        rationale: `VIX elevated at ${vixItem.value}, suggesting increased market uncertainty`,
        risk: 'VIX may revert quickly if volatility subsides',
      });
    }
  }

  if (briefing.nuclearWatch) {
    const criticalNuclear = briefing.nuclearWatch.filter((n) => n.status === 'critical');
    if (criticalNuclear.length > 0) {
      ideas.push({
        direction: 'long',
        asset: 'GLD',
        timeframe: '1-3 months',
        confidence: 50,
        rationale: `Nuclear radiation anomalies detected at ${criticalNuclear.map((n) => n.name).join(', ')}`,
        risk: 'Anomalies may be sensor errors or temporary',
      });
    }
  }

  if (briefing.osintFeed) {
    const criticalOsint = briefing.osintFeed.filter((p) => p.urgency === 'critical');
    if (criticalOsint.length > 0) {
      ideas.push({
        direction: 'short',
        asset: 'EEM',
        timeframe: '1-2 weeks',
        confidence: 45,
        rationale: `${criticalOsint.length} critical OSINT signals detected, potential geopolitical risk`,
        risk: 'OSINT signals may not translate to market impact',
      });
    }
  }

  if (ideas.length === 0) {
    ideas.push({
      direction: 'hedge',
      asset: 'TLT',
      timeframe: '1 month',
      confidence: 30,
      rationale: 'No strong directional signals detected, defensive positioning recommended',
      risk: 'Opportunity cost of hedging in stable conditions',
    });
  }

  return ideas;
}

export async function generateTradeIdeas(
  config: LLMConfig,
  briefing: BriefingData,
): Promise<TradeIdea[]> {
  const userPrompt = buildBriefingSummary(briefing);

  try {
    const response = await callLLM(config, userPrompt, SYSTEM_PROMPT);
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      return generateFallbackIdeas(briefing);
    }

    return parsed.map((idea: Record<string, unknown>) => ({
      direction: (['long', 'short', 'hedge'].includes(idea.direction as string)
        ? idea.direction
        : 'hedge') as TradeIdea['direction'],
      asset: (idea.asset as string) || 'UNKNOWN',
      timeframe: (idea.timeframe as string) || 'unknown',
      confidence: typeof idea.confidence === 'number' ? idea.confidence : 50,
      rationale: (idea.rationale as string) || '',
      risk: (idea.risk as string) || '',
    }));
  } catch {
    return generateFallbackIdeas(briefing);
  }
}
