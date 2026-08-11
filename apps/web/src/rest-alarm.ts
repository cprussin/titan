/** The rest-over alarm: a repeating beep the {@link RestTimer} starts when the
 *  clock hits zero and stops when the athlete ends the rest. This module is thin
 *  glue over the Web Audio API — the decision of *when* to start and stop lives
 *  in the timer, which injects a fake in its tests, so this has no unit test of
 *  its own. */

export type Alarm = {
  start: () => void;
  stop: () => void;
};

const BEEP_HZ = 880;
const BEEP_SEC = 0.15;
const BEEP_INTERVAL_MS = 750;

/** Builds an idempotent alarm handle. `start`/`stop` may each be called more
 *  than once (e.g. Stop pressed, then the timer unmounts) and settle to the same
 *  state either way. The `AudioContext` is created lazily on first `start`, so a
 *  rest that never reaches zero touches no audio hardware. */
export const createAlarm = (): Alarm => {
  let context: AudioContext | undefined;
  let interval: ReturnType<typeof setInterval> | undefined;

  const beep = () => {
    const active = (context ??= new AudioContext());
    const oscillator = active.createOscillator();
    const gain = active.createGain();
    oscillator.frequency.value = BEEP_HZ;
    oscillator.connect(gain);
    gain.connect(active.destination);
    oscillator.start();
    oscillator.stop(active.currentTime + BEEP_SEC);
  };

  return {
    start: () => {
      if (interval === undefined) {
        beep();
        interval = setInterval(beep, BEEP_INTERVAL_MS);
      }
    },
    stop: () => {
      if (interval !== undefined) {
        clearInterval(interval);
        interval = undefined;
      }
      if (context !== undefined && context.state !== "closed") {
        context.close().catch((error: unknown) => {
          // biome-ignore lint/suspicious/noConsole: surface audio teardown failure
          console.error("Failed to close alarm audio context", error);
        });
      }
    },
  };
};
