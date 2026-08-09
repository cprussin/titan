"use client";

import type { ComponentProps } from "react";
import { Badge, Button } from "../ui";
import { useSelectActiveBlock } from "./useSelectActiveBlock";

type Props = {
  /** Whether this block is already the athlete's active position. */
  active: boolean;
  blockId: string;
  versionId: string;
  /** The action label shown when the block isn't active. */
  label?: string | undefined;
  size?: ComponentProps<typeof Button>["size"];
  variant?: ComponentProps<typeof Button>["variant"];
};

/** Makes this block the athlete's active position — resetting them to its first
 *  week — then refreshes so the change is reflected. When the block is already
 *  active it shows a static marker instead of an action. */
export const SetActiveBlockButton = ({
  active,
  blockId,
  label = "Set as active block",
  size = "md",
  variant = "primary",
  versionId,
}: Props) => {
  const { select, selecting } = useSelectActiveBlock(versionId, blockId);

  return active ? (
    <Badge tone="success">Active</Badge>
  ) : (
    <Button loading={selecting} onClick={select} size={size} variant={variant}>
      {label}
    </Button>
  );
};
