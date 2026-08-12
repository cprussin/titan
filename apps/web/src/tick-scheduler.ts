/** A repeating one-second tick, returning a canceler. The countdown rest timer
 *  and the count-up workout stopwatch both take this as an injected dependency
 *  so tests can drive the clock by hand instead of waiting on real time. */
export type ScheduleTick = (onTick: () => void) => () => void;

export const scheduleTick: ScheduleTick = (onTick) => {
  const id = setInterval(onTick, 1000);
  return () => {
    clearInterval(id);
  };
};
