const DEFAULT_TIMEOUT_MS = 10000;

export function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const mergedInit: RequestInit = {
    ...init,
    signal: controller.signal,
  };

  return fetch(input, mergedInit).finally(() => clearTimeout(timeoutId));
}
