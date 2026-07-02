type CacheEntry<T> = {
  expiresAt: number;
  payload: T;
};

const TTL_MS = 3 * 60 * 1000;
const reportCache = new Map<string, CacheEntry<unknown>>();

export function getCachedReportPayload<T>(namespace: string, key: string) {
  const entry = reportCache.get(`${namespace}:${key}`);
  if (!entry || entry.expiresAt < Date.now()) {
    return null;
  }
  return entry.payload as T;
}

export function setCachedReportPayload<T>(
  namespace: string,
  key: string,
  payload: T
) {
  reportCache.set(`${namespace}:${key}`, {
    expiresAt: Date.now() + TTL_MS,
    payload
  });
}

