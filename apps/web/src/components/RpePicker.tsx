import { css } from "../../styled-system/css";
import { hstack, vstack } from "../../styled-system/patterns";
import { Slider } from "../ui";

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
 */
export const RpePicker = ({ onChange, value }: Props) => (
  <div className={vstack({ alignItems: "stretch", gap: 1 })}>
    <div className={hstack({ gap: 2, justifyContent: "space-between" })}>
      <span className={labelStyles}>RPE (optional)</span>
      <span className={valueStyles}>{value ?? "—"}</span>
    </div>
    <Slider
      aria-label="RPE"
      max={RPE_MAX}
      min={RPE_MIN}
      onValueChange={onChange}
      value={value ?? RPE_MIN}
    />
  </div>
);

const labelStyles = css({ color: "muted", fontSize: "sm" });

const valueStyles = css({
  color: "accent",
  fontFamily: "condensed",
  fontSize: "lg",
  fontVariantNumeric: "tabular-nums",
  fontWeight: "bold",
});
