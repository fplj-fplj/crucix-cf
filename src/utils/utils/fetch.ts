export async function safeFetch(
  url: string,
  options?: RequestInit,
  timeoutMs = 15000,
  retries = 2,
): Promise<Response> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err instanceof DOMException && err.name === 'AbortError') {
        lastError = new Error('Request timeout');
      } else {
        lastError = err instanceof Error ? err : new Error(String(err));
      }

      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  throw lastError ?? new Error('Request failed');
}

export async function safeFetchJSON<T = unknown>(
  url: string,
  options?: RequestInit,
  timeoutMs = 15000,
  retries = 2,
): Promise<T> {
  const response = await safeFetch(url, options, timeoutMs, retries);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}
