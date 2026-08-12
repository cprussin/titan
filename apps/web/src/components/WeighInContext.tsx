"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useMemo, useState } from "react";

type WeighIn = {
  close: () => void;
  open: () => void;
  /** Whether the body-weight trend card is in its inline entry mode. */
  weighingIn: boolean;
};

// Defaults to "not weighing in" so a card rendered outside a provider (e.g. in a
// unit test) reads as display mode.
const WeighInContext = createContext<WeighIn>({
  close: () => undefined,
  open: () => undefined,
  weighingIn: false,
});

/** Read the shared weigh-in state — the trends card enters entry mode and the
 *  headline's "Weigh in" button opens it, though they sit far apart in the page. */
export const useWeighIn = (): WeighIn => useContext(WeighInContext);

/** Holds whether a weigh-in is in progress, shared between the headline trigger
 *  and the body-weight trend card it swaps into an editor. */
export const WeighInProvider = ({ children }: { children: ReactNode }) => {
  const [weighingIn, setWeighingIn] = useState(false);
  const value = useMemo(
    () => ({
      close: () => setWeighingIn(false),
      open: () => setWeighingIn(true),
      weighingIn,
    }),
    [weighingIn],
  );
  return (
    <WeighInContext.Provider value={value}>{children}</WeighInContext.Provider>
  );
};
