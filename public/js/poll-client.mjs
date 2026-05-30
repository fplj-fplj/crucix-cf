let pollTimer = null;
let initialTimer = null;
let lastTimestamp = null;
const POLL_INTERVAL = 30000;
const INITIAL_INTERVAL = 5000;

async function fetchBriefing() {
  try {
    const res = await fetch('/api/briefing');
    if (!res.ok) return null;
    const json = await res.json();
    if (json.status === 'no_data') return null;
    return json.data || null;
  } catch {
    return null;
  }
}

function dispatchUpdate(data) {
  window.dispatchEvent(new CustomEvent('briefingupdate', { detail: data }));
}

async function poll() {
  const data = await fetchBriefing();
  if (!data) return;
  if (lastTimestamp && data.timestamp === lastTimestamp) return;
  lastTimestamp = data.timestamp;
  dispatchUpdate(data);
}

async function initialPoll() {
  const data = await fetchBriefing();
  if (!data) return;
  lastTimestamp = data.timestamp;
  dispatchUpdate(data);
  startRegularPoll();
}

function stopInitialPoll() {
  if (initialTimer !== null) {
    clearInterval(initialTimer);
    initialTimer = null;
  }
}

function startRegularPoll() {
  stopInitialPoll();
  if (pollTimer !== null) return;
  pollTimer = setInterval(poll, POLL_INTERVAL);
}

export function startPolling() {
  if (pollTimer !== null) return;
  initialPoll();
}

export function stopPolling() {
  if (pollTimer !== null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  stopInitialPoll();
}

export function forceRefresh() {
  stopPolling();
  lastTimestamp = null;
  startPolling();
}
