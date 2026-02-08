const DEFAULT_TIMEOUT_MS = 10000;
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), resolvedTimeoutMs);

  const mergedInit: RequestInit = {
    ...init,
    signal: controller.signal,
  };

  return fetch(input, mergedInit).finally(() => clearTimeout(timeoutId));
}
