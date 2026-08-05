import type { Tone } from "./components/Badge";

/** The badge tone that color-codes each exercise role, so a plan reads its
 *  primary / secondary / accessory structure at a glance. */
export const roleTone = (role: string): Tone => {
  switch (role) {
    case "primary": {
      return "accent";
    }
    case "secondary": {
      return "success";
    }
    case "accessory": {
      return "warning";
    }
    default: {
      return "neutral";
    }
  }
};
