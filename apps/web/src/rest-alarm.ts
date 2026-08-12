/** The rest-over alarm: a repeating beep the {@link RestTimer} starts when the
 *  clock hits zero and stops when the athlete ends the rest. This module is thin
 *  glue over the Web Audio API — the decision of *when* to start and stop lives
 *  in the timer, which injects a fake in its tests, so this has no unit test of
 *  its own. */

export type Alarm = {
  start: () => void;
  stop: () => void;
  /** A subtle countdown blip, played once per second through the final ten
   *  seconds before the alarm proper takes over at zero. */
  tick: () => void;
};

/** The overtime chime: a rising perfect fifth (A5 → E6), each note eased in and
 *  out so it lands as a mellow two-note bell rather than a flat square beep. */
const CHIME_HZ = [880, 1318.51];
const CHIME_NOTE_SEC = 0.18;
const CHIME_GAIN = 0.18;
const CHIME_INTERVAL_MS = 1200;

/** The last-ten-seconds countdown blip: one short, quiet tick that reads as a
 *  metronome without competing with the chime that follows it. */
const TICK_HZ = 660;
const TICK_SEC = 0.06;
const TICK_GAIN = 0.08;

/** A single sine note with a short attack/release so it never clicks. `gain`
 *  ramps from silence up to its peak and back down across the note's life. */
const playNote = (
  context: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  peakGain: number,
) => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = frequency;
  oscillator.connect(gain);
  gain.connect(context.destination);
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(peakGain, startAt + duration * 0.15);
  gain.gain.linearRampToValueAtTime(0, startAt + duration);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration);
};

/** Builds an idempotent alarm handle. `start`/`stop` may each be called more
 *  than once (e.g. Stop pressed, then the timer unmounts) and settle to the same
 *  state either way. `tick` plays the subtle countdown blip. The `AudioContext`
 *  is created lazily on first sound, so a rest whose final ten seconds and zero
 *  are never reached touches no audio hardware. */
export const createAlarm = (): Alarm => {
  let context: AudioContext | undefined;
  let interval: ReturnType<typeof setInterval> | undefined;

  const chime = () => {
    const active = (context ??= new AudioContext());
    CHIME_HZ.forEach((frequency, index) => {
      const startAt = active.currentTime + index * CHIME_NOTE_SEC;
      playNote(active, frequency, startAt, CHIME_NOTE_SEC, CHIME_GAIN);
    });
  };

  return {
    start: () => {
      if (interval === undefined) {
        chime();
        interval = setInterval(chime, CHIME_INTERVAL_MS);
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
    tick: () => {
      const active = (context ??= new AudioContext());
      playNote(active, TICK_HZ, active.currentTime, TICK_SEC, TICK_GAIN);
    },
  };
};
