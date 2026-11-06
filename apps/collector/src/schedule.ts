/**
 * Agenda diária escalonada: cada fonte pertence a uma de 4 janelas (slot 0..3),
 * que começam às 00h, 06h, 12h e 18h UTC. Cada fonte é varrida no máximo uma vez
 * por período de 24h, e uma janela perdida (servidor desligado) é recuperada
 * assim que o processo volta.
 */
export const SLOT_HOURS = 6;
export const SLOT_COUNT = 4;

/** Início do período atual da janela: a ocorrência mais recente de `slot*6h` UTC que seja <= now. */
export function periodStart(slot: number, now: Date): Date {
  const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const today = dayStart + slot * SLOT_HOURS * 3600_000;
  return new Date(today <= now.getTime() ? today : today - 24 * 3600_000);
}

export function isDue(slot: number, lastScanAt: Date | null, now: Date): boolean {
  return lastScanAt === null || lastScanAt.getTime() < periodStart(slot, now).getTime();
}

/** Próximo horário em que a fonte ficará pendente. */
export function nextRun(slot: number, lastScanAt: Date | null, now: Date): Date {
  if (isDue(slot, lastScanAt, now)) return now;
  return new Date(periodStart(slot, now).getTime() + 24 * 3600_000);
}
