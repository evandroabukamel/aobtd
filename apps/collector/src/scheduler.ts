import { runDueScans, type ScanDeps } from './scanner.js';

/**
 * Periodically checks whether a daily window has started. The "one scan a day" control
 * lives in the database (claimSource), so restarting the process or running more than one
 * instance does not cause extra scans.
 */
export function startScheduler(deps: ScanDeps, intervalMs = 5 * 60_000): () => void {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await runDueScans(deps);
    } catch (err) {
      deps.log?.(`scheduler: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      running = false;
    }
  };
  void tick();
  const timer = setInterval(tick, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}
