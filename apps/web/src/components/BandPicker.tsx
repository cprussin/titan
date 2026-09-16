import type { BandLevel } from "@titan/domain/band";
import { BAND_COMBINATIONS } from "@titan/domain/band";
import { bandLabel } from "../band-label";
import { Field, Select } from "../ui";

/** The value a "no band recorded" choice carries. The dropdown needs a real
 *  option to get back to unrecorded — base-ui has no clear affordance — and an
 *  empty string can never collide with a combination's key. */
const NOT_RECORDED = "";

const NOT_RECORDED_LABEL = "Not recorded";

/** The combinations as dropdown options, built once: each keyed by its bands so
 *  the choice maps straight back to the levels it stands for. */
const BAND_OPTIONS = [
  { label: NOT_RECORDED_LABEL, value: NOT_RECORDED },
  ...BAND_COMBINATIONS.map((bands) => ({
    label: bandLabel(bands),
    value: bands.join("+"),
  })),
];

type Props = {
  onChange: (bands: readonly BandLevel[] | undefined) => void;
  value: readonly BandLevel[] | undefined;
};

/**
 * The band entry for a logged set: the combinations the athlete's band set
 * makes, ordered from lightest to heaviest. Recording the band is optional —
 * unlike reps and RPE nothing waits on it — so the dropdown opens on "Not
 * recorded" and can be put back there.
 */
export const BandPicker = ({ onChange, value }: Props) => (
  <Field label="Band">
    <Select
      aria-label="Band"
      onValueChange={(selected) => {
        onChange(bandsForKey(selected));
      }}
      options={BAND_OPTIONS}
      value={value === undefined ? NOT_RECORDED : value.join("+")}
    />
  </Field>
);

/** The bands a chosen option stands for, or `undefined` for the "not recorded"
 *  option — the key is the bands themselves, joined. */
const bandsForKey = (key: string | null): readonly BandLevel[] | undefined =>
  key === null || key === NOT_RECORDED
    ? undefined
    : BAND_COMBINATIONS.find((bands) => bands.join("+") === key);
