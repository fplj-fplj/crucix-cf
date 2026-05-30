import { LLMConfig, DeltaData, BriefingData, Alert, AlertTier } from "../../types";
import { callLLM } from './provider';

const SYSTEM_PROMPT = `You are an intelligence analyst evaluating signal changes for alert severity and cross-domain correlation. Assess each signal change and determine if it warrants an alert.

For each alert, provide:
- tier: "FLASH", "PRIORITY", or "ROUTINE"
- title: concise alert title
- description: detailed assessment with cross-domain correlations
- sources: array of source names involved
- confidence: 0-100 score
- correlations: array of correlated domains or signals

FLASH: Immediate threat, requires instant attention (nuclear anomalies, major conflict escalation, market crash signals)
PRIORITY: Significant development requiring prompt review (economic shifts, new conflicts, OSINT surges)
ROUTINE: Notable change worth monitoring (minor data shifts, routine fluctuations)

Respond with a JSON array of alerts. No other text.`;

function buildDeltaSummary(delta: DeltaData, briefing: BriefingData): string {
  const parts: string[] = [];

  parts.push(`Delta Status: ${delta.overallStatus}`);
  parts.push(`Summary: ${delta.summary}`);
  parts.push(`Timestamp: ${delta.timestamp}`);

  if (delta.entries && delta.entries.length > 0) {
    const entries = delta.entries
      .map((e) => {
        let entry = `[${e.severity}] ${e.type} from ${e.source}: ${e.description}`;
        if (e.oldValue !== undefined && e.newValue !== undefined) {
          entry += ` (${e.oldValue} -> ${e.newValue})`;
        }
        return entry;
      })
      .join('\n');
    parts.push(`Delta Entries:\n${entries}`);
  }

  if (briefing.riskGauges && briefing.riskGauges.length > 0) {
    const gauges = briefing.riskGauges
      .map((g) => `${g.name}: ${g.value}${g.unit || ''} (trend: ${g.trend || 'stable'}, threshold: ${g.threshold})`)
      .join('; ');
    parts.push(`Current Risk Gauges: ${gauges}`);
  }

  if (briefing.crossSignals && briefing.crossSignals.length > 0) {
    const signals = briefing.crossSignals
      .map((s) => `${s.domain}: ${(s.signals || []).join(', ')} (severity: ${s.severity || 'low'}, correlation: ${s.correlation || 0})`)
      .join('; ');
    parts.push(`Cross-Domain Signals: ${signals}`);
  }

  if (briefing.nuclearWatch) {
    const filteredNuclear = briefing.nuclearWatch.filter((n) => n.status !== 'normal');
    if (filteredNuclear.length > 0) {
      const nuclear = filteredNuclear
        .map((n) => `${n.name}: ${n.cpm} CPM (${n.status})`)
        .join('; ');
      parts.push(`Nuclear Alerts: ${nuclear}`);
    }
  }

  return parts.join('\n\n');
}

export async function evaluateAlerts(
  delta: DeltaData,
  briefing: BriefingData,
  config: LLMConfig,
): Promise<Alert[]> {
  const userPrompt = buildDeltaSummary(delta, briefing);

  const response = await callLLM(config, userPrompt, SYSTEM_PROMPT);
  const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed)) {
    throw new Error('LLM did not return an array of alerts');
  }

  return parsed.map((alert: Record<string, unknown>, index: number) => ({
    id: `llm-${Date.now()}-${index}`,
    tier: Object.values(AlertTier).includes(alert.tier as AlertTier)
      ? (alert.tier as AlertTier)
      : AlertTier.ROUTINE,
    title: (alert.title as string) || 'Untitled Alert',
    description: (alert.description as string) || '',
    timestamp: new Date().toISOString(),
    sources: Array.isArray(alert.sources) ? (alert.sources as string[]) : [],
    confidence: typeof alert.confidence === 'number' ? alert.confidence : 50,
    correlations: Array.isArray(alert.correlations) ? (alert.correlations as string[]) : [],
  }));
}
