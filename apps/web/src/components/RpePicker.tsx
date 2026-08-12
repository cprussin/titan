import { css } from "../../styled-system/css";
import { hstack } from "../../styled-system/patterns";
import { Field, ToggleGroup } from "../ui";

const RPE_MIN = 1;
const RPE_MAX = 10;

// The 1–10 effort buttons, built once. Values are the stringified numbers the
// toggle group keys on; the picker maps them back to numbers at the boundary.
const RPE_ITEMS = Array.from({ length: RPE_MAX - RPE_MIN + 1 }, (_, index) => {
  const value = String(index + RPE_MIN);
  return { label: value, value };
});

type Props = {
  onChange: (value: number | undefined) => void;
  value: number | undefined;
};

/**
 * The optional RPE (rate of perceived exertion) entry for a logged set: a 1–10
 * toggle group with a live numeric readout. A toggle group beats a slider on
 * phones, where dragging a thumb to a precise value one-handed is fiddly — here
 * every value is a direct tap. The value stays unset — shown as an em dash —
 * until the athlete taps a button, so an untouched set records no RPE; tapping
 * the selected button again clears it back to unset.
 *
 * The readout rides on the field's label row (as an `aria-hidden` adornment so
 * it never pollutes the group's accessible name — the selection is already
 * carried by the pressed toggle's `aria-pressed`).
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
    <ToggleGroup
      aria-label="RPE (optional)"
      items={RPE_ITEMS}
      onValueChange={([selected]) => {
        // Single-select: `selected` is the tapped value, or `undefined` when the
        // athlete taps the pressed button to clear it back to unset.
        onChange(selected === undefined ? undefined : Number(selected));
      }}
      value={value === undefined ? [] : [String(value)]}
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
