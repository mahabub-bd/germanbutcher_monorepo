/**
 * In-process stale-while-revalidate cache.
 *
 * `get(key, load)` semantics:
 * - no entry → await load(), store, return (concurrent first loads share one
 *   in-flight promise)
 * - entry younger than freshTtlMs → return immediately
 * - entry older → return the stale value immediately and kick off exactly one
 *   background refresh (single-flight), so N concurrent requests cost the DB
 *   one query instead of N — this is what prevents the cache-expiry herd.
 *
 * Values are shared across requests; treat them as read-only.
 */
export class SwrCache<T> {
  private readonly entries = new Map<
    string,
    { value: T; storedAt: number; refreshing: boolean }
  >();
  private readonly inFlight = new Map<string, Promise<T>>();

  constructor(
    /** How long a value is served without touching the loader. */
    private readonly freshTtlMs: number,
    /** Hard age cap — older entries are dropped and reloaded synchronously. */
    private readonly maxStaleMs: number,
    /** Entry cap; the oldest entries are evicted when exceeded. */
    private readonly maxEntries = 300,
  ) {}

  get(key: string, load: () => Promise<T>): Promise<T> {
    const entry = this.entries.get(key);
    const age = entry ? Date.now() - entry.storedAt : Infinity;

    if (entry && age < this.freshTtlMs) {
      return Promise.resolve(entry.value);
    }

    // Expired beyond the stale window (or no entry): refresh synchronously,
    // deduplicating concurrent loads behind one promise.
    if (!entry || age >= this.maxStaleMs) {
      return this.loadShared(key, load);
    }

    // Stale but serviceable: refresh once in the background, serve stale now.
    if (!entry.refreshing) {
      entry.refreshing = true;
      void this.loadShared(key, load).catch(() => {
        // Background refresh failed — the stale entry stays for the next try.
      });
    }
    return Promise.resolve(entry.value);
  }

  /** Drop entries — with no prefix the whole cache is cleared. */
  invalidate(prefix?: string): void {
    if (prefix === undefined) {
      this.entries.clear();
      return;
    }
    for (const key of this.entries.keys()) {
      if (key.startsWith(prefix)) this.entries.delete(key);
    }
  }

  private loadShared(key: string, load: () => Promise<T>): Promise<T> {
    const pending = this.inFlight.get(key);
    if (pending) return pending;

    const promise = load()
      .then((value) => {
        this.entries.set(key, { value, storedAt: Date.now(), refreshing: false });
        this.evictOldest();
        return value;
      })
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  private evictOldest(): void {
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value;
      if (oldest === undefined) break;
      this.entries.delete(oldest);
    }
  }
}
