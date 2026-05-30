import type { BriefingData, DeltaData, DeltaEntry, SensorGridItem, RiskGauge, NuclearSite, SpaceObject, OsintPost, NewsItem } from "../../types";
import { DELTA_THRESHOLDS } from './thresholds';

function compareSensorGrid(current: SensorGridItem[] = [], previous: SensorGridItem[] = []): DeltaEntry[] {
  const entries: DeltaEntry[] = [];
  const prevMap = new Map(previous.map((item) => [item.name, item]));

  for (const cur of current) {
    const prev = prevMap.get(cur.name);
    if (!prev) continue;

    const diff = cur.value - prev.value;
    const absDiff = Math.abs(diff);
    const threshold = DELTA_THRESHOLDS.numeric[cur.name] ?? DELTA_THRESHOLDS.defaultNumeric;

    if (absDiff >= threshold) {
      let severity: DeltaEntry['severity'] = 'low';
      if (absDiff >= threshold * 3) severity = 'critical';
      else if (absDiff >= threshold * 2) severity = 'high';
      else if (absDiff >= threshold) severity = 'medium';

      entries.push({
        type: 'numeric_change',
        source: cur.name,
        description: `${cur.name}: ${prev.value} → ${cur.value} (${diff > 0 ? '+' : ''}${diff.toFixed(2)} ${cur.unit})`,
        severity,
        oldValue: prev.value,
        newValue: cur.value,
      });
    }
  }

  return entries;
}

function compareRiskGauges(current: RiskGauge[] = [], previous: RiskGauge[] = []): DeltaEntry[] {
  const entries: DeltaEntry[] = [];
  const prevMap = new Map(previous.map((g) => [g.name, g]));

  for (const cur of current) {
    const prev = prevMap.get(cur.name);
    if (!prev) continue;

    const diff = cur.value - prev.value;
    const absDiff = Math.abs(diff);
    const threshold = DELTA_THRESHOLDS.numeric[cur.name] ?? DELTA_THRESHOLDS.defaultNumeric;

    if (absDiff >= threshold) {
      const crossedUp = prev.value < cur.threshold && cur.value >= cur.threshold;
      const crossedDown = prev.value >= cur.threshold && cur.value < cur.threshold;

      let type: DeltaEntry['type'] = 'numeric_change';
      let severity: DeltaEntry['severity'] = 'low';

      if (crossedUp) {
        type = 'escalation';
        severity = 'high';
      } else if (crossedDown) {
        type = 'deescalation';
        severity = 'medium';
      } else if (absDiff >= threshold * 2) {
        severity = 'high';
      } else {
        severity = 'medium';
      }

      entries.push({
        type,
        source: cur.name,
        description: `${cur.name}: ${prev.value} → ${cur.value} (${diff > 0 ? '+' : ''}${diff.toFixed(2)} ${cur.unit})${crossedUp ? ' [THRESHOLD BREACHED]' : crossedDown ? ' [BELOW THRESHOLD]' : ''}`,
        severity,
        oldValue: prev.value,
        newValue: cur.value,
      });
    }
  }

  return entries;
}

function compareNuclearWatch(current: NuclearSite[] = [], previous: NuclearSite[] = []): DeltaEntry[] {
  const entries: DeltaEntry[] = [];
  const prevMap = new Map(previous.map((s) => [s.name, s]));

  for (const cur of current) {
    const prev = prevMap.get(cur.name);
    if (!prev) continue;

    const diff = cur.cpm - prev.cpm;
    const absDiff = Math.abs(diff);

    if (absDiff >= DELTA_THRESHOLDS.counts.radiationCpm) {
      const escalated = prev.status === 'normal' && (cur.status === 'elevated' || cur.status === 'critical');
      const deescalated = (prev.status === 'elevated' || prev.status === 'critical') && cur.status === 'normal';

      entries.push({
        type: escalated ? 'escalation' : deescalated ? 'deescalation' : 'numeric_change',
        source: `Nuclear: ${cur.name}`,
        description: `${cur.name}: ${prev.cpm} → ${cur.cpm} CPM (${diff > 0 ? '+' : ''}${diff.toFixed(1)})`,
        severity: cur.status === 'critical' ? 'critical' : cur.status === 'elevated' ? 'high' : 'low',
        oldValue: prev.cpm,
        newValue: cur.cpm,
      });
    }
  }

  return entries;
}

function compareSpaceWatch(current: SpaceObject[] = [], previous: SpaceObject[] = []): DeltaEntry[] {
  const entries: DeltaEntry[] = [];
  const prevMap = new Map(previous.map((o) => [o.name, o]));

  for (const cur of current) {
    const prev = prevMap.get(cur.name);
    if (!prev) {
      entries.push({
        type: 'new',
        source: 'SpaceWatch',
        description: `New space object: ${cur.name} (${cur.type})`,
        severity: 'low',
      });
      continue;
    }

    const diff = cur.count - prev.count;
    if (Math.abs(diff) >= DELTA_THRESHOLDS.counts.spaceObjects) {
      entries.push({
        type: diff > 0 ? 'escalation' : 'deescalation',
        source: `Space: ${cur.name}`,
        description: `${cur.name}: ${prev.count} → ${cur.count} objects (${diff > 0 ? '+' : ''}${diff})`,
        severity: diff > 50 ? 'high' : diff > 20 ? 'medium' : 'low',
        oldValue: prev.count,
        newValue: cur.count,
      });
    }
  }

  return entries;
}

function compareOsintFeed(current: OsintPost[] = [], previous: OsintPost[] = []): DeltaEntry[] {
  const entries: DeltaEntry[] = [];
  const prevKeys = new Set(previous.map((p) => `${p.channel}:${p.time}:${p.content.slice(0, 80)}`));

  const newPosts = current.filter((p) => !prevKeys.has(`${p.channel}:${p.time}:${p.content.slice(0, 80)}`));

  const criticalNew = newPosts.filter((p) => p.urgency === 'critical');
  const highNew = newPosts.filter((p) => p.urgency === 'high');

  if (criticalNew.length > 0) {
    entries.push({
      type: 'new',
      source: 'OSINT',
      description: `${criticalNew.length} new critical OSINT post(s) detected`,
      severity: 'critical',
    });
  }

  if (highNew.length > 0) {
    entries.push({
      type: 'new',
      source: 'OSINT',
      description: `${highNew.length} new high-urgency OSINT post(s) detected`,
      severity: 'high',
    });
  }

  if (newPosts.length > 0 && criticalNew.length === 0 && highNew.length === 0) {
    entries.push({
      type: 'new',
      source: 'OSINT',
      description: `${newPosts.length} new OSINT post(s) detected`,
      severity: 'low',
    });
  }

  const curKeys = new Set(current.map((p) => `${p.channel}:${p.time}:${p.content.slice(0, 80)}`));
  const disappeared = previous.filter((p) => !curKeys.has(`${p.channel}:${p.time}:${p.content.slice(0, 80)}`));
  if (disappeared.length > 0) {
    entries.push({
      type: 'deescalation',
      source: 'OSINT',
      description: `${disappeared.length} OSINT post(s) no longer present`,
      severity: 'low',
    });
  }

  return entries;
}

function compareNewsTicker(current: NewsItem[] = [], previous: NewsItem[] = []): DeltaEntry[] {
  const entries: DeltaEntry[] = [];
  const prevKeys = new Set(previous.map((n) => `${n.source}:${n.title}`));

  const newItems = current.filter((n) => !prevKeys.has(`${n.source}:${n.title}`));
  if (newItems.length > 0) {
    entries.push({
      type: 'new',
      source: 'News',
      description: `${newItems.length} new news item(s)`,
      severity: newItems.length > 20 ? 'medium' : 'low',
    });
  }

  return entries;
}

function computeOverallStatus(entries: DeltaEntry[]): DeltaData['overallStatus'] {
  if (entries.length === 0) return 'stable';

  const hasCritical = entries.some((e) => e.severity === 'critical');
  const hasEscalation = entries.some((e) => e.type === 'escalation');
  const hasDeescalation = entries.some((e) => e.type === 'deescalation');

  if (hasCritical || (hasEscalation && !hasDeescalation)) return 'alert';
  if (hasEscalation && hasDeescalation) return 'shift';
  if (hasDeescalation && !hasEscalation) return 'stable';
  return 'shift';
}

function buildSummary(entries: DeltaEntry[]): string {
  const changes = entries.length;
  const critical = entries.filter((e) => e.severity === 'critical').length;
  const newSignals = entries.filter((e) => e.type === 'new').length;
  const escalations = entries.filter((e) => e.type === 'escalation').length;
  const deescalations = entries.filter((e) => e.type === 'deescalation').length;

  const parts: string[] = [];
  parts.push(`${changes} change(s)`);
  if (critical > 0) parts.push(`${critical} critical`);
  if (newSignals > 0) parts.push(`${newSignals} new signal(s)`);
  if (escalations > 0) parts.push(`${escalations} escalation(s)`);
  if (deescalations > 0) parts.push(`${deescalations} de-escalation(s)`);

  return parts.join(' | ');
}

export function computeDelta(current: BriefingData, previous: BriefingData | null): DeltaData {
  if (!previous) {
    const entries: DeltaEntry[] = [];
    const changes = entries.length;
    const critical = 0;
    const newSignals = 0;
    const items: any[] = [];
    
    return {
      timestamp: new Date().toISOString(),
      overallStatus: 'stable',
      entries,
      summary: 'Initial sweep — no previous data for comparison',
      changes,
      critical,
      new: newSignals,
      items,
    };
  }

  const entries: DeltaEntry[] = [
    ...compareSensorGrid(current.sensorGrid, previous.sensorGrid),
    ...compareRiskGauges(current.riskGauges, previous.riskGauges),
    ...compareNuclearWatch(current.nuclearWatch, previous.nuclearWatch),
    ...compareSpaceWatch(current.spaceWatch, previous.spaceWatch),
    ...compareOsintFeed(current.osintFeed, previous.osintFeed),
    ...compareNewsTicker(current.newsTicker, previous.newsTicker),
  ];

  const overallStatus = computeOverallStatus(entries);
  const summary = buildSummary(entries);
  const changes = entries.length;
  const critical = entries.filter((e) => e.severity === 'critical').length;
  const newSignals = entries.filter((e) => e.type === 'new').length;
  const items = entries.map(e => ({
    type: e.type,
    title: e.description,
    description: e.description,
    source: e.source,
    timestamp: new Date().toISOString(),
    severity: e.severity,
  }));

  return {
    timestamp: new Date().toISOString(),
    overallStatus,
    entries,
    summary,
    changes,
    critical,
    new: newSignals,
    items,
  };
}
