const isDev = process.env.NODE_ENV !== "production";

export function devLog(scope: string, message: string, data?: unknown) {
  if (!isDev) return;

  if (typeof data === "undefined") {
    console.log(`[dev:${scope}] ${message}`);
    return;
  }

  console.log(`[dev:${scope}] ${message}`, data);
}

export function devWarn(scope: string, message: string, data?: unknown) {
  if (!isDev) return;

  if (typeof data === "undefined") {
    console.warn(`[dev:${scope}] ${message}`);
    return;
  }

  console.warn(`[dev:${scope}] ${message}`, data);
}
