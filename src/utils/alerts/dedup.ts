import type { Alert } from "../../types";
import { AlertTier } from "../../types";

const SIMILARITY_THRESHOLD = 0.7;

const TIER_RANK: Record<AlertTier, number> = {
  [AlertTier.FLASH]: 3,
  [AlertTier.PRIORITY]: 2,
  [AlertTier.ROUTINE]: 1,
};

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }

  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function mergeAlerts(keeper: Alert, merged: Alert): Alert {
  const sources = new Set([...keeper.sources, ...merged.sources]);
  const correlations = new Set([
    ...(keeper.correlations || []),
    ...(merged.correlations || []),
  ]);

  return {
    ...keeper,
    sources: Array.from(sources),
    correlations: Array.from(correlations),
    confidence: Math.max(keeper.confidence || 0, merged.confidence || 0),
  };
}

export function deduplicateAlerts(alerts: Alert[]): Alert[] {
  if (alerts.length <= 1) return alerts;

  const tokens = alerts.map((a) => tokenize(a.title));
  const merged: boolean[] = new Array(alerts.length).fill(false);
  const result: Alert[] = [];

  for (let i = 0; i < alerts.length; i++) {
    if (merged[i]) continue;

    let keeper = alerts[i];

    for (let j = i + 1; j < alerts.length; j++) {
      if (merged[j]) continue;

      const similarity = jaccardSimilarity(tokens[i], tokens[j]);
      if (similarity > SIMILARITY_THRESHOLD) {
        merged[j] = true;

        const keeperRank = TIER_RANK[keeper.tier];
        const otherRank = TIER_RANK[alerts[j].tier];

        if (otherRank > keeperRank) {
          keeper = mergeAlerts(alerts[j], keeper);
        } else {
          keeper = mergeAlerts(keeper, alerts[j]);
        }
      }
    }

    result.push(keeper);
  }

  return result;
}
