import type { Alert } from "../../types";

const HISTORY_KEY = 'alerts:history';
const MAX_HISTORY = 200;

export async function getAlertHistory(kv: KVNamespace, limit = 50): Promise<Alert[]> {
  const raw = await kv.get(HISTORY_KEY, { type: 'text' });
  if (!raw) return [];
  const alerts: Alert[] = JSON.parse(raw);
  return alerts.slice(0, limit);
}

export async function addAlertsToHistory(kv: KVNamespace, alerts: Alert[]): Promise<void> {
  const raw = await kv.get(HISTORY_KEY, { type: 'text' });
  const existing: Alert[] = raw ? JSON.parse(raw) : [];
  const merged = [...alerts, ...existing].slice(0, MAX_HISTORY);
  await kv.put(HISTORY_KEY, JSON.stringify(merged));
}
