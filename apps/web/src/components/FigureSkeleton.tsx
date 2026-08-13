import { css } from "../../styled-system/css";
import { Skeleton } from "../ui";

type Props = {
  width: string;
};

/** An end-aligned skeleton bar sized for a grid's numeric column, so a loading
 *  figure sits under its header like the real value does. */
export const FigureSkeleton = ({ width }: Props) => (
  <span className={wrapStyles}>
    <Skeleton height="0.875rem" width={width} />
  </span>
);

const wrapStyles = css({ display: "flex", justifyContent: "flex-end" });
