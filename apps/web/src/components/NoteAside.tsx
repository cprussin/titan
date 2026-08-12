import { css } from "../../styled-system/css";
import { vstack } from "../../styled-system/patterns";

type Props = {
  notes: readonly string[];
};

/** The engine's voice beside the grid: a left-ruled aside carrying one quiet
 *  line per note — a future day's projection caveat, or a logged day's
 *  adaptation decisions. Renders nothing when there is nothing to say. */
export const NoteAside = ({ notes }: Props) =>
  notes.length === 0 ? undefined : (
    <aside className={asideStyles}>
      {notes.map((note) => (
        <p className={noteStyles} key={note}>
          {note}
        </p>
      ))}
    </aside>
  );

// A 35%-accent hairline on the leading edge sets the engine's notes apart from
// the ledger without boxing them in.
const asideStyles = vstack({
  alignItems: "stretch",
  borderInlineStart:
    "1px solid color-mix(in oklab, {colors.accent} 35%, {colors.border})",
  gap: 1.5,
  paddingInlineStart: 3.5,
});

const noteStyles = css({ color: "muted", fontSize: "sm" });
