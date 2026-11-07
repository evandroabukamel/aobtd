/**
 * Staggered daily schedule: each source belongs to one of 4 windows (slot 0..3),
 * starting at 00h, 06h, 12h and 18h UTC. Each source is scanned at most once
 * per 24h period, and a missed window (server down) is caught up
 * as soon as the process comes back.
 */
export const SLOT_HOURS = 6;
export const SLOT_COUNT = 4;

/** Start of the window's current period: the latest occurrence of `slot*6h` UTC that is <= now. */
export function periodStart(slot: number, now: Date): Date {
  const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const today = dayStart + slot * SLOT_HOURS * 3600_000;
  return new Date(today <= now.getTime() ? today : today - 24 * 3600_000);
}

export function isDue(slot: number, lastScanAt: Date | null, now: Date): boolean {
  return lastScanAt === null || lastScanAt.getTime() < periodStart(slot, now).getTime();
}

/** Next time the source becomes due. */
export function nextRun(slot: number, lastScanAt: Date | null, now: Date): Date {
  if (isDue(slot, lastScanAt, now)) return now;
  return new Date(periodStart(slot, now).getTime() + 24 * 3600_000);
}
