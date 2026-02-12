const DEFAULT_TIMEOUT_MS = 30000;
const UPLOAD_TIMEOUT_MS = 60000;

function combineSignals(signals: Array<AbortSignal | null | undefined>) {
  const validSignals = signals.filter(Boolean) as AbortSignal[];
  if (validSignals.length === 0) return undefined;
  if (validSignals.length === 1) return validSignals[0];

  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.any === "function") {
    return AbortSignal.any(validSignals);
  }

  const controller = new AbortController();
  const abortFrom = (signal: AbortSignal) => {
    if (controller.signal.aborted) return;
    controller.abort(signal.reason);
  };

  validSignals.forEach((signal) => {
    if (signal.aborted) {
      abortFrom(signal);
      return;
    }

    signal.addEventListener("abort", () => abortFrom(signal), { once: true });
  });

  return controller.signal;
}

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
    signal: combineSignals([init?.signal ?? null, timeoutController.signal]),
  };

  return fetch(input, mergedInit).finally(() => clearTimeout(timeoutId));
}
