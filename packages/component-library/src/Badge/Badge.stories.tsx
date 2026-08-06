import type { Meta, StoryObj } from "@storybook/react-vite";
import { Variants } from "../__test__/Variants";

import { Badge as BadgeComponent, TONES } from "./Badge";

const meta = {
  args: {
    children: "Primary",
    tone: "accent",
  },
  argTypes: {
    children: { control: "text", table: { category: "Contents" } },
    tone: { control: "select", options: TONES, table: { category: "Style" } },
  },
  component: BadgeComponent,
  parameters: {
    docs: {
      description: {
        component:
          "A small tinted label for a role, goal, or status. Each tone is a soft fill of a semantic color with matching text.",
      },
    },
  },
  tags: ["autodocs"],
  title: "Data Display/Badge",
} satisfies Meta<typeof BadgeComponent>;
export default meta;

export const Badge: StoryObj<typeof BadgeComponent> = {};

export const AllTones: StoryObj<typeof BadgeComponent> = {
  parameters: { controls: { exclude: ["tone"] } },
  render: (props) => (
    <Variants rowLabel={(row) => row} rows={TONES}>
      {(tone) => (
        <BadgeComponent {...props} tone={tone}>
          {tone}
        </BadgeComponent>
      )}
    </Variants>
  ),
};
