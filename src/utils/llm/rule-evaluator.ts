import { DeltaData, BriefingData, Alert, AlertTier } from "../../types";

export function evaluateAlertsRuleBased(
  delta: DeltaData,
  briefing: BriefingData,
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();

  if (briefing.markets && briefing.markets.length > 0) {
    const vixItem = briefing.markets
      .flatMap((m) => m.items || [])
      .find((i) => i && i.name && i.name.toLowerCase().includes('vix'));

    if (vixItem && delta.entries) {
      const vixDelta = delta.entries.find(
        (e) => e && e.source && (e.source.toLowerCase().includes('vix') || e.description.toLowerCase().includes('vix')),
      );
      if (vixDelta && vixDelta.oldValue !== undefined && vixDelta.newValue !== undefined) {
        const vixChange = Math.abs(vixDelta.newValue - vixDelta.oldValue);
        if (vixChange > 5) {
          alerts.push({
            id: `rule-vix-flash-${Date.now()}`,
            tier: AlertTier.FLASH,
            title: `VIX Spike: ${vixDelta.newValue.toFixed(1)} (+${vixChange.toFixed(1)})`,
            description: `VIX moved ${vixChange.toFixed(1)} points to ${vixDelta.newValue.toFixed(1)}, indicating extreme market fear. Cross-correlate with equity and bond positions.`,
            timestamp: now,
            sources: ['yahoo-finance', 'market-data'],
            confidence: 85,
            correlations: ['equities', 'bonds', 'volatility'],
          });
        } else if (vixChange > 2) {
          alerts.push({
            id: `rule-vix-priority-${Date.now()}`,
            tier: AlertTier.PRIORITY,
            title: `VIX Increase: ${vixDelta.newValue.toFixed(1)} (+${vixChange.toFixed(1)})`,
            description: `VIX rose ${vixChange.toFixed(1)} points. Monitor for continued escalation.`,
            timestamp: now,
            sources: ['yahoo-finance'],
            confidence: 70,
            correlations: ['equities', 'volatility'],
          });
        }
      }
    }
  }

  if (briefing.nuclearWatch) {
    const criticalNuclear = briefing.nuclearWatch.filter((n) => n.status === 'critical');
    if (criticalNuclear.length > 0) {
      alerts.push({
        id: `rule-nuclear-flash-${Date.now()}`,
        tier: AlertTier.FLASH,
        title: `Nuclear Radiation Anomaly: ${criticalNuclear.map((n) => n.name).join(', ')}`,
        description: `Critical radiation levels detected at ${criticalNuclear.map((n) => `${n.name} (${n.cpm} CPM)`).join(', ')}. Immediate investigation required.`,
        timestamp: now,
        sources: ['safecast', 'epa-radnet'],
        confidence: 75,
        correlations: ['nuclear', 'environmental', 'geopolitical'],
      });
    }
  }

  if (delta.entries) {
    const conflictEscalation = delta.entries.filter(
      (e) =>
        e && e.type === 'escalation' &&
        e.source && (e.source.toLowerCase().includes('acled') || e.source.toLowerCase().includes('gdelt')) &&
        e.severity === 'critical',
    );
    if (conflictEscalation.length > 0) {
      alerts.push({
        id: `rule-conflict-flash-${Date.now()}`,
        tier: AlertTier.FLASH,
        title: `Conflict Escalation: ${conflictEscalation.map((e) => e.description).join('; ')}`,
        description: `Major conflict escalation detected across ${conflictEscalation.length} events. Cross-domain impact likely.`,
        timestamp: now,
        sources: conflictEscalation.map((e) => e.source),
        confidence: 80,
        correlations: ['geopolitical', 'defense', 'energy', 'commodities'],
      });
    }
  }

  if (delta.entries) {
    const economicDeltas = delta.entries.filter(
      (e) =>
        e && e.source && (
          e.source.toLowerCase().includes('fred') ||
          e.source.toLowerCase().includes('eia') ||
          e.source.toLowerCase().includes('gscpi')
        ),
    );
    const significantEconomic = economicDeltas.filter(
      (e) => e.severity === 'high' || e.severity === 'critical',
    );
    if (significantEconomic.length > 0) {
      alerts.push({
        id: `rule-economic-priority-${Date.now()}`,
        tier: AlertTier.PRIORITY,
        title: `Significant Economic Indicator Change`,
        description: significantEconomic.map((e) => e.description).join('; '),
        timestamp: now,
        sources: significantEconomic.map((e) => e.source),
        confidence: 65,
        correlations: ['macro', 'bonds', 'currencies'],
      });
    }
  }

  if (delta.entries) {
    const newConflictEvents = delta.entries.filter(
      (e) =>
        e && e.type === 'new' &&
        e.source && (e.source.toLowerCase().includes('acled') || e.source.toLowerCase().includes('gdelt')),
    );
    if (newConflictEvents.length > 0) {
      alerts.push({
        id: `rule-conflict-new-${Date.now()}`,
        tier: AlertTier.PRIORITY,
        title: `New Conflict Events Detected`,
        description: newConflictEvents.map((e) => e.description).join('; '),
        timestamp: now,
        sources: newConflictEvents.map((e) => e.source),
        confidence: 60,
        correlations: ['geopolitical', 'defense'],
      });
    }
  }

  if (briefing.osintFeed && delta.entries) {
    const urgentOsint = briefing.osintFeed.filter((p) => p.urgency === 'critical' || p.urgency === 'high');
    const osintSurge = delta.entries.filter(
      (e) =>
        e && e.source && (
          e.source.toLowerCase().includes('osint') ||
          e.source.toLowerCase().includes('telegram')
        ),
    );
    if (urgentOsint.length >= 3 || osintSurge.length >= 3) {
      alerts.push({
        id: `rule-osint-priority-${Date.now()}`,
        tier: AlertTier.PRIORITY,
        title: `OSINT Urgent Posts Surge`,
        description: `${urgentOsint.length} urgent OSINT posts and ${osintSurge.length} new OSINT delta entries. Potential developing situation.`,
        timestamp: now,
        sources: ['telegram-osint'],
        confidence: 55,
        correlations: ['geopolitical', 'information-operations'],
      });
    }
  }

  if (delta.entries) {
    const routineDeltas = delta.entries.filter(
      (e) => e && e.severity === 'low' && e.type === 'numeric_change',
    );
    if (routineDeltas.length > 0 && alerts.length === 0) {
      alerts.push({
        id: `rule-routine-${Date.now()}`,
        tier: AlertTier.ROUTINE,
        title: `Routine Data Changes`,
        description: `${routineDeltas.length} minor data changes detected. No significant cross-domain correlations.`,
        timestamp: now,
        sources: [...new Set(routineDeltas.map((e) => e.source).filter(Boolean))],
        confidence: 40,
        correlations: [],
      });
    }
  }

  if (alerts.length === 0) {
    alerts.push({
      id: `rule-stable-${Date.now()}`,
      tier: AlertTier.ROUTINE,
      title: `System Stable`,
      description: `No significant signal changes detected. All domains within normal parameters.`,
      timestamp: now,
      sources: [],
      confidence: 90,
      correlations: [],
    });
  }

  return alerts;
}

export const evaluateAlertsByRules = evaluateAlertsRuleBased;
