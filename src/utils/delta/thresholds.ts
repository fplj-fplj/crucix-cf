export const DELTA_THRESHOLDS: {
  defaultNumeric: number;
  numeric: Record<string, number>;
  counts: {
    urgentPosts: number;
    thermalTotal: number;
    radiationCpm: number;
    spaceObjects: number;
    conflictEvents: number;
    newsItems: number;
    outageEvents: number;
  };
  severity: {
    numericMultipliers: Record<string, number>;
    escalationRules: { metric: string; above: number; severity: 'low' | 'medium' | 'high' | 'critical' }[];
    deescalationRules: { metric: string; below: number; severity: 'low' | 'medium' | 'high' | 'critical' }[];
  };
} = {
  defaultNumeric: 1,
  numeric: {
    'Aviation Activity': 500,
    'ADS-B Tracked': 500,
    'Thermal Detections': 1000,
    'Radiation Anomalies': 2,
    'Maritime Traffic': 200,
    'Conflict Events': 50,
    'Health Alerts': 3,
    'News Volume': 20,
    'OSINT Urgent': 3,
    'Active Satellites': 50,
    'Known Exploited Vulns': 10,
    'Internet Outages': 2,
    'US National Debt': 50,
    'Supply Chain Pressure': 0.5,
    'Sanctions List': 100,
    'CBOE Volatility Index (VIX)': 3,
    'VIXCLS': 3,
    'High Yield Spread': 0.5,
    'BAMLH0A0HYM2': 0.5,
    'Trade Weighted U.S. Dollar Index': 2,
    'DTWEXBGS': 2,
    'Initial Jobless Claims': 20000,
    'ICSA': 20000,
    'Consumer Price Index': 2,
    'CPIAUCSL': 2,
    'M2 Money Stock': 100,
    'WM2NS': 100,
    '30-Year Fixed Rate Mortgage': 0.25,
    'MORTGAGE30US': 0.25,
    'Global Supply Chain Pressure Index': 0.5,
    'GSCPI': 0.5,
  },
  counts: {
    urgentPosts: 3,
    thermalTotal: 1000,
    radiationCpm: 20,
    spaceObjects: 10,
    conflictEvents: 20,
    newsItems: 30,
    outageEvents: 3,
  },
  severity: {
    numericMultipliers: {
      low: 1,
      medium: 2,
      high: 3,
      critical: 5,
    },
    escalationRules: [
      { metric: 'VIXCLS', above: 30, severity: 'critical' },
      { metric: 'VIXCLS', above: 20, severity: 'high' },
      { metric: 'BAMLH0A0HYM2', above: 5, severity: 'critical' },
      { metric: 'BAMLH0A0HYM2', above: 3, severity: 'high' },
      { metric: 'GSCPI', above: 2, severity: 'critical' },
      { metric: 'GSCPI', above: 1, severity: 'high' },
    ],
    deescalationRules: [
      { metric: 'VIXCLS', below: 15, severity: 'low' },
      { metric: 'BAMLH0A0HYM2', below: 2, severity: 'low' },
      { metric: 'GSCPI', below: 0, severity: 'low' },
    ],
  },
};
