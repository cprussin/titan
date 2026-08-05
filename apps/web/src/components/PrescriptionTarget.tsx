import type { Prescription } from "@titan/domain/prescription";
import { css, cva } from "../../styled-system/css";
import { prescriptionParts } from "../prescription-text";

type Props = {
  prescription: Prescription;
  /** Matches the surrounding text scale — `sm` in dense rows, `lg` under the
   *  active-exercise heading. Defaults to `sm`. */
  size?: "lg" | "sm" | undefined;
};

/**
 * A prescription's target, with any recovery clause dropped to a second,
 * dimmer line so an interval row (e.g. "8 × 500m @ 1:45" + "1:30 recovery")
 * doesn't stretch a column wide. Prescriptions without a recovery clause render
 * as a single line.
 */
export const PrescriptionTarget = ({ prescription, size = "sm" }: Props) => {
  const { primary, recovery } = prescriptionParts(prescription);
  return (
    <span className={wrapStyles}>
      <span className={primaryStyles({ size })}>{primary}</span>
      {recovery !== undefined && (
        <span className={recoveryStyles({ size })}>{recovery}</span>
      )}
    </span>
  );
};

const wrapStyles = css({
  display: "flex",
  flexDirection: "column",
  gap: 0.5,
});

const primaryStyles = cva({
  base: { color: "muted" },
  variants: {
    size: {
      lg: { fontSize: "lg" },
      sm: { fontSize: "sm" },
    },
  },
});

const recoveryStyles = cva({
  base: { color: "muted" },
  variants: {
    size: {
      lg: { fontSize: "sm" },
      sm: { fontSize: "xs" },
    },
  },
});
