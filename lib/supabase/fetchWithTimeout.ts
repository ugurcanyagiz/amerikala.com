const DEFAULT_TIMEOUT_MS = 30000;
const UPLOAD_TIMEOUT_MS = 60000;

function combineAbortSignals(signals: Array<AbortSignal | undefined>): AbortSignal | undefined {
  const activeSignals = signals.filter(Boolean) as AbortSignal[];
  if (!activeSignals.length) return undefined;
  if (activeSignals.length === 1) return activeSignals[0];

  // Modern runtimes support AbortSignal.any and preserve abort reasons.
  if (typeof AbortSignal !== "undefined" && typeof AbortSignal.any === "function") {
    return AbortSignal.any(activeSignals);
  }

  const controller = new AbortController();
  const abortFromSource = (source: AbortSignal) => {
    if (controller.signal.aborted) return;
    controller.abort(source.reason);
  };

  for (const source of activeSignals) {
    if (source.aborted) {
      abortFromSource(source);
      break;
    }

    source.addEventListener("abort", () => abortFromSource(source), { once: true });
  }

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

  const mergedSignal = combineAbortSignals([init?.signal, timeoutController.signal]);

  const mergedInit: RequestInit = {
    ...init,
    signal: mergedSignal,
  };

  return fetch(input, mergedInit).finally(() => clearTimeout(timeoutId));
}
