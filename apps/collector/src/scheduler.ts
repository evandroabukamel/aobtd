import { runDueScans, type ScanDeps } from './scanner.js';

/**
 * Verifica periodicamente se alguma janela diária começou. O controle de "uma varredura
 * por dia" fica no banco (claimSource), então reiniciar o processo ou rodar mais de uma
 * instância não gera varreduras extras.
 */
export function startScheduler(deps: ScanDeps, intervalMs = 5 * 60_000): () => void {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await runDueScans(deps);
    } catch (err) {
      deps.log?.(`agendador: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      running = false;
    }
  };
  void tick();
  const timer = setInterval(tick, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}
