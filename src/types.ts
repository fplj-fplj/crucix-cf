export interface Env {
  BRIEFING_KV: KVNamespace;
  CONFIG_KV: KVNamespace;
  __STATIC_CONTENT: KVNamespace;
  ASSETS?: {
    fetch: (request: Request) => Promise<Response>;
  };
  ENCRYPTION_KEY?: string;
}

export interface Settings {
  llm: LLMConfig;
  translation: TranslationConfig;
  sweep: SweepConfig;
  alerts: AlertConfig;
  bots: BotConfig;
}

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKeys: Record<string, string>;
  apiKey?: string; // 兼容性
}

export enum LLMProvider {
  ANTHROPIC = 'anthropic',
  Anthropic = 'anthropic',
  OpenAI = 'openai',
  OPENAI = 'openai',
  Gemini = 'gemini',
  GEMINI = 'gemini',
  OpenRouter = 'openrouter',
  OPENROUTER = 'openrouter',
  MiniMax = 'minimax',
  MINIMAX = 'minimax',
  Mistral = 'mistral',
  MISTRAL = 'mistral',
  Grok = 'grok',
  GROK = 'grok',
}

export interface TranslationConfig {
  provider: 'free' | LLMProvider;
  targetLanguage: string;
  enabled: boolean;
}

export interface SweepConfig {
  intervalMinutes: number;
  sources: string[];
}

export interface AlertConfig {
  enabled: boolean;
  thresholds: AlertThresholds;
}

export interface AlertThresholds {
  severity: 'low' | 'medium' | 'high' | 'critical';
  cooldownMinutes: number;
}

export interface BotConfig {
  telegram: {
    enabled: boolean;
    botToken: string;
    chatId: string;
  };
  discord: {
    enabled: boolean;
    webhookUrl: string;
    botToken: string;
    applicationId: string;
  };
}

export interface SourceResult {
  name: string;
  source?: string;
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

export interface SweepResult {
  briefing: BriefingData;
  sourceResults: SourceResult[];
  timestamp: string;
}

export interface BriefingData {
  summary: string;
  translation?: any;
  alerts: AlertResult[];
  timestamp: string;
  region?: string;
  sweepDelta?: DeltaData;
  crossSignals?: any[];
  newsTicker?: any[];
  osintFeed?: any[];
  riskGauges?: any[];
  nuclearWatch?: any[];
  markets?: any[];
  sensorGrid?: any[];
  spaceWatch?: any[];
}

export interface AlertResult {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  source: string;
  timestamp: string;
}

export interface DeltaData {
  changes: number;
  critical: number;
  new: number;
  entries?: any[];
  overallStatus?: string;
  summary?: string;
  items: DeltaItem[];
  timestamp: string;
}

export interface DeltaItem {
  type: 'new' | 'changed' | 'critical' | 'numeric_change' | 'escalation' | 'deescalation';
  title: string;
  description: string;
  source: string;
  timestamp: string;
  oldValue?: any;
  newValue?: any;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface SweepStatus {
  lastSweep: string;
  nextSweep: string;
  sourceCount: number;
  healthySources: number;
  isSweeping: boolean;
}

export interface Alert {
  id: string;
  tier: AlertTier;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  source?: string;
  sources: string[];
  timestamp: string;
  confidence?: number;
  correlations?: string[];
}

export enum AlertTier {
  FLASH = 'FLASH',
  PRIORITY = 'PRIORITY',
  ROUTINE = 'ROUTINE',
}

export interface TradeIdea {
  direction: 'long' | 'short' | 'hedge';
  asset: string;
  timeframe: string;
  confidence: number;
  rationale: string;
  risk: string;
}

// 缺失的类型定义
export interface DeltaEntry {
  type: 'new' | 'changed' | 'numeric_change' | 'escalation' | 'deescalation';
  source: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  oldValue?: number;
  newValue?: number;
}

export interface SensorGridItem {
  name: string;
  value: number;
  unit: string;
}

export interface RiskGauge {
  name: string;
  value: number;
  unit: string;
  threshold: number;
  trend?: string;
}

export interface NuclearSite {
  name: string;
  cpm: number;
  status: 'normal' | 'elevated' | 'critical';
}

export interface SpaceObject {
  name: string;
  type: string;
  count: number;
}

export interface OsintPost {
  channel: string;
  time: string;
  content: string;
  urgency: 'low' | 'high' | 'critical';
}

export interface NewsItem {
  source: string;
  title: string;
  category?: string;
}
