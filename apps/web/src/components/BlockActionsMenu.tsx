"use client";

import { TargetIcon } from "@phosphor-icons/react/dist/ssr/Target";
import { useState } from "react";
import { css } from "../../styled-system/css";
import { Badge, Button, ModalDialog } from "../ui";
import { useSelectActiveBlock } from "./useSelectActiveBlock";

type Props = {
  /** Whether this block is already the athlete's active position. */
  active: boolean;
  blockId: string;
  blockName: string;
  versionId: string;
};

/**
 * The trailing control on a block row. When the block is already active it's a
 * static "Active" badge that lets taps fall through to the row's link;
 * otherwise it's a target button — layered above the row's stretched link (see
 * the Programs page) — that opens a small confirmation to make the block
 * active. Both wrappers are flex boxes so their content centers on the row
 * without the baseline drop an inline wrapper would introduce.
 */
export const BlockActionsMenu = ({
  active,
  blockId,
  blockName,
  versionId,
}: Props) => {
  const [open, setOpen] = useState(false);
  const { select, selecting } = useSelectActiveBlock(versionId, blockId, () =>
    setOpen(false),
  );

  return active ? (
    <span className={badgeWrapStyles}>
      <Badge tone="success">Active</Badge>
    </span>
  ) : (
    <span className={triggerWrapStyles}>
      <ModalDialog
        footer={
          <>
            <ModalDialog.CloseButton variant="ghost">
              Cancel
            </ModalDialog.CloseButton>
            <Button loading={selecting} onClick={select} variant="accent">
              Set as active
            </Button>
          </>
        }
        onOpenChange={setOpen}
        open={open}
        title={`Make ${blockName} active?`}
        trigger={
          <Button
            label={`Set ${blockName} as active block`}
            size="sm"
            variant="ghost"
          >
            <TargetIcon />
          </Button>
        }
      >
        This makes {blockName} your active block and resets today&rsquo;s plan
        to its first week.
      </ModalDialog>
    </span>
  );
};

// The active label is non-interactive: `pointer-events: none` lets hover and
// taps fall through to the row's stretched link so the whole active row still
// navigates to the block detail.
const badgeWrapStyles = css({
  alignItems: "center",
  display: "flex",
  flexShrink: 0,
  pointerEvents: "none",
});

// The trigger sits above the row link's stretched overlay so its own taps open
// the confirmation instead of navigating.
const triggerWrapStyles = css({
  alignItems: "center",
  display: "flex",
  flexShrink: 0,
  position: "relative",
  zIndex: 1,
});
