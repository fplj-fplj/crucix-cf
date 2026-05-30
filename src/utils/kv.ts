import type {
  BriefingData,
  DeltaData,
  Settings,
  SweepStatus,
  Alert,
  Env,
} from '../types';

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;
const ENCODING = 'utf-8';

async function deriveKey(encryptionKey: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(encryptionKey),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('crucix-kv-salt'),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encrypt(plaintext: string, encryptionKey: string): Promise<string> {
  const key = await deriveKey(encryptionKey);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const encoder = new TextEncoder();
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoder.encode(plaintext),
  );
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(ciphertext: string, encryptionKey: string): Promise<string> {
  const key = await deriveKey(encryptionKey);
  const combined = Uint8Array.from(atob(ciphertext), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, IV_LENGTH);
  const data = combined.slice(IV_LENGTH);
  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    data,
  );
  return new TextDecoder(ENCODING).decode(decrypted);
}

async function getJson<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const raw = await kv.get(key, { type: 'text' });
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

async function setJson<T>(kv: KVNamespace, key: string, value: T): Promise<void> {
  await kv.put(key, JSON.stringify(value));
}

export async function getBriefing(kv: KVNamespace): Promise<BriefingData | null> {
  return getJson<BriefingData>(kv, 'briefing:latest');
}

export async function setBriefing(kv: KVNamespace, data: BriefingData): Promise<void> {
  await setJson(kv, 'briefing:latest', data);
  await setJson(kv, `briefing:${data.timestamp}`, data);
}

export async function getDelta(kv: KVNamespace): Promise<DeltaData | null> {
  return getJson<DeltaData>(kv, 'delta:latest');
}

export async function setDelta(kv: KVNamespace, data: DeltaData): Promise<void> {
  await setJson(kv, 'delta:latest', data);
  await setJson(kv, `delta:${data.timestamp}`, data);
}

export async function getSettings(kv: KVNamespace, env: Env): Promise<Settings | null> {
  const raw = await kv.get('settings', { type: 'text' });
  if (!raw) return null;
  if (!env.ENCRYPTION_KEY) return JSON.parse(raw) as Settings;
  const decrypted = await decrypt(raw, env.ENCRYPTION_KEY);
  return JSON.parse(decrypted) as Settings;
}

export async function setSettings(kv: KVNamespace, settings: Settings, env: Env): Promise<void> {
  const serialized = JSON.stringify(settings);
  if (!env.ENCRYPTION_KEY) {
    await kv.put('settings', serialized);
    return;
  }
  const encrypted = await encrypt(serialized, env.ENCRYPTION_KEY);
  await kv.put('settings', encrypted);
}

export async function getSweepStatus(kv: KVNamespace): Promise<SweepStatus | null> {
  return getJson<SweepStatus>(kv, 'sweep:status');
}

export async function setSweepStatus(kv: KVNamespace, status: SweepStatus): Promise<void> {
  await setJson(kv, 'sweep:status', status);
}

export async function getAlertHistory(kv: KVNamespace, limit = 50): Promise<Alert[]> {
  const alerts = await getJson<Alert[]>(kv, 'alerts:history');
  if (!alerts) return [];
  return alerts.slice(0, limit);
}

export async function addAlertsToHistory(kv: KVNamespace, alerts: Alert[]): Promise<void> {
  const existing = await getAlertHistory(kv);
  const newAlerts = [...alerts, ...existing];
  const trimmed = newAlerts.slice(0, 200);
  await setJson(kv, 'alerts:history', trimmed);
}

export async function addAlert(kv: KVNamespace, alert: Alert): Promise<void> {
  const existing = await getAlertHistory(kv);
  existing.unshift(alert);
  const trimmed = existing.slice(0, 200);
  await setJson(kv, 'alerts:history', trimmed);
}
