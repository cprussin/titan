"use client";

import type { ReactNode } from "react";
import { createContext, useContext, useState } from "react";

type NavDrawerValue = {
  close: () => void;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const NavDrawerContext = createContext<NavDrawerValue | undefined>(undefined);

/**
 * Shares the left-nav drawer's open state between the menu button (in the top
 * bar) and the drawer itself (the AppNav rail), which live in separate subtrees.
 * The drawer only exists in the `mdToLg` window; on phones the bottom tab bar
 * and from `lg` up the permanent sidebar make it moot, so its state is simply
 * ignored there.
 */
export const NavDrawerProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const close = () => {
    setOpen(false);
  };
  return (
    <NavDrawerContext.Provider value={{ close, open, setOpen }}>
      {children}
    </NavDrawerContext.Provider>
  );
};

/** Reads the shared drawer state; throws outside a {@link NavDrawerProvider}. */
export const useNavDrawer = (): NavDrawerValue => {
  const value = useContext(NavDrawerContext);
  if (value === undefined) {
    throw new Error("useNavDrawer must be used within a NavDrawerProvider");
  }
  return value;
};
