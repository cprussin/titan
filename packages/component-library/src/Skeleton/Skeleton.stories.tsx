import type { Meta, StoryObj } from "@storybook/react-vite";
import { vstack } from "../../styled-system/patterns";
import { Variants } from "../__test__/Variants";

import { SKELETON_RADII, Skeleton as SkeletonComponent } from "./Skeleton";

const meta = {
  args: {
    height: "1rem",
    radius: "sm",
    width: "12rem",
  },
  argTypes: {
    height: { control: "text", table: { category: "Size" } },
    radius: {
      control: "select",
      options: SKELETON_RADII,
      table: { category: "Style" },
    },
    width: { control: "text", table: { category: "Size" } },
  },
  component: SkeletonComponent,
  parameters: {
    docs: {
      description: {
        component:
          "A pulsing placeholder block that stands in for content while a page loads.",
      },
    },
  },
  tags: ["autodocs"],
  title: "Data Display/Skeleton",
} satisfies Meta<typeof SkeletonComponent>;
export default meta;

export const Skeleton: StoryObj<typeof SkeletonComponent> = {};

export const AllRadii: StoryObj<typeof SkeletonComponent> = {
  parameters: { controls: { exclude: ["radius"] } },
  render: (props) => (
    <Variants rowLabel={(row) => row} rows={SKELETON_RADII}>
      {(radius) => <SkeletonComponent {...props} radius={radius} />}
    </Variants>
  ),
};

// A stack of lines of varying width — the shape a paragraph or a list row
// collapses to while its data loads.
export const TextLines: StoryObj<typeof SkeletonComponent> = {
  parameters: { controls: { exclude: ["width", "height"] } },
  render: (props) => (
    <div className={textLinesStyles}>
      <SkeletonComponent {...props} height="1rem" width="100%" />
      <SkeletonComponent {...props} height="1rem" width="80%" />
      <SkeletonComponent {...props} height="1rem" width="60%" />
    </div>
  ),
};

const textLinesStyles = vstack({
  alignItems: "stretch",
  gap: 3,
  inlineSize: "20rem",
});
