import { css } from "../../styled-system/css";
import { hstack } from "../../styled-system/patterns";
import { Field, Slider } from "../ui";

const RPE_MIN = 1;
const RPE_MAX = 10;

type Props = {
  onChange: (value: number) => void;
  value: number | undefined;
};

/**
 * The optional RPE (rate of perceived exertion) entry for a logged set: a
 * 1–10 slider with a live numeric readout. The value stays unset — shown as an
 * em dash — until the athlete moves the slider, so an untouched set records no
 * RPE; the slider rests at its minimum while unset.
 *
 * The readout rides on the field's label row (as an `aria-hidden` adornment so
 * it never pollutes the slider's accessible name — the value is already carried
 * by the slider's `aria-valuenow`).
 */
export const RpePicker = ({ onChange, value }: Props) => (
  <Field
    label={
      <span className={labelRowStyles}>
        <span>RPE (optional)</span>
        <span aria-hidden className={valueStyles}>
          {value ?? "—"}
        </span>
      </span>
    }
  >
    <Slider
      max={RPE_MAX}
      min={RPE_MIN}
      onValueChange={onChange}
      value={value ?? RPE_MIN}
    />
  </Field>
);

const labelRowStyles = hstack({ gap: 2, justifyContent: "space-between" });

const valueStyles = css({
  color: "accent",
  fontFamily: "condensed",
  fontSize: "lg",
  fontVariantNumeric: "tabular-nums",
  fontWeight: "bold",
});
