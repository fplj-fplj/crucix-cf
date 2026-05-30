import type { SourceResult, BriefingData } from '../../types';

export function synthesizeBriefing(results: SourceResult[]): BriefingData {
  return {
    summary: 'No data sources configured yet.',
    alerts: [],
    timestamp: new Date().toISOString(),
  };
}
