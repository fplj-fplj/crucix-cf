import type { DeltaData, BriefingData, LLMConfig, Alert } from '../../types';
import { AlertTier } from '../../types';

export async function classifyAlerts(
  delta: DeltaData,
  briefing: BriefingData,
  llmConfig: LLMConfig | undefined
): Promise<Alert[]> {
  return [];
}
