import type { SourceResult, Settings, BriefingData, DeltaData } from '../../types';
import { computeDelta as computeDeltaEngine } from '../delta/engine';

export interface SweepResult {
  briefing: BriefingData;
  sourceResults: SourceResult[];
  timestamp: string;
}

export async function runSweep(config: Settings): Promise<SweepResult> {
  const sourceResults: SourceResult[] = [];

  const briefing: BriefingData = {
    summary: 'No data sources configured yet.',
    alerts: [],
    timestamp: new Date().toISOString(),
  };

  return {
    briefing,
    sourceResults,
    timestamp: new Date().toISOString(),
  };
}

export { computeDeltaEngine as computeDelta };
