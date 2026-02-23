const DEFAULT_TIMEOUT_MS = 30000;
const UPLOAD_TIMEOUT_MS = 60000;

export function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs?: number
) {
  const isUploadBody =
    typeof init?.body !== "undefined" &&
    (init.body instanceof Blob ||
      init.body instanceof ArrayBuffer ||
      init.body instanceof Uint8Array ||
      init.body instanceof FormData);

  const resolvedTimeoutMs =
    typeof timeoutMs === "number"
      ? timeoutMs
      : isUploadBody
        ? UPLOAD_TIMEOUT_MS
        : DEFAULT_TIMEOUT_MS;

  const timeoutController = new AbortController();
  const timeoutId = setTimeout(() => {
    timeoutController.abort(new DOMException("Request timed out", "TimeoutError"));
  }, resolvedTimeoutMs);

  const mergedInit: RequestInit = {
    ...init,
    // NOTE: We intentionally do not propagate caller-provided abort signals here.
    // Some Supabase internal callers abort aggressively during auth/router transitions,
    // which creates noisy AbortError spam in the app even for expected cancellations.
    // We keep a timeout-based abort to avoid hanging requests.
    signal: timeoutController.signal,
  };

  return fetch(input, mergedInit).finally(() => clearTimeout(timeoutId));
}
