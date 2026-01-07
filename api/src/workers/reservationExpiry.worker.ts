import { logger } from "../logger";
import { expireReservationsOnce } from "../services/reservationExpiry.service";

type WorkerOptions = {
  intervalMs?: number;
  batchLimit?: number;
};

export function startReservationExpiryWorker(options?: WorkerOptions) {
  const intervalMs = options?.intervalMs ?? 2000;
  const batchLimit = options?.batchLimit ?? 500;

  let timer: NodeJS.Timeout | null = null;
  let inFlight = false;
  let stopped = false;

  async function tick() {
    if (stopped || inFlight) return;
    inFlight = true;
    try {
      const result = await expireReservationsOnce({ limit: batchLimit });
      if (result.expiredCount > 0) {
        logger.info(
          { expiredCount: result.expiredCount, updatedDropIds: result.updatedDropIds },
          "Expired reservations processed"
        );
      }
    } catch (err) {
      logger.error({ err }, "Failed to process expired reservations");
    } finally {
      inFlight = false;
    }
  }

  // On boot: run one cleanup cycle immediately, then poll
  void tick();
  timer = setInterval(() => void tick(), intervalMs);
  timer.unref?.();

  return () => {
    stopped = true;
    if (timer) clearInterval(timer);
    timer = null;
  };
}

