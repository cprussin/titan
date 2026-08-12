import type { Meta, StoryObj } from "@storybook/react-vite";
import { SIZES, ToggleGroup as ToggleGroupComponent } from "./ToggleGroup";

const EFFORT = [
  { label: "1", value: "1" },
  { label: "2", value: "2" },
  { label: "3", value: "3" },
  { label: "4", value: "4" },
  { label: "5", value: "5" },
] as const;

const meta = {
  args: {
    "aria-label": "Effort",
    defaultValue: ["3"],
    disabled: false,
    items: EFFORT,
    multiple: false,
    size: "md",
  },
  argTypes: {
    "aria-label": {
      control: "text",
      table: { category: "Accessibility" },
    },
    defaultValue: {
      control: false,
      table: { category: "Value" },
    },
    disabled: {
      control: "boolean",
      table: { category: "State" },
    },
    items: {
      control: false,
      table: { category: "Contents" },
    },
    multiple: {
      control: "boolean",
      table: { category: "State" },
    },
    size: {
      control: "select",
      options: SIZES,
      table: { category: "Appearance" },
    },
  },
  component: ToggleGroupComponent,
  parameters: {
    docs: {
      description: {
        component:
          "A segmented row of toggle buttons wrapping the @base-ui/react ToggleGroup + Toggle primitives — a touch-friendly way to pick from a small, fixed set of values. Single-select by default; pass `multiple` for multi-select.",
      },
    },
  },
  tags: ["autodocs"],
  title: "Forms & Inputs/ToggleGroup",
} satisfies Meta<typeof ToggleGroupComponent>;
export default meta;

export const ToggleGroup: StoryObj<typeof ToggleGroupComponent> = {
  args: {
    "aria-label": "Effort",
    defaultValue: ["3"],
    disabled: false,
    items: EFFORT,
    multiple: false,
    size: "md",
  },
};

export const Multiple = {
  args: {
    "aria-label": "Days trained",
    defaultValue: ["mon", "wed", "fri"],
    disabled: false,
    items: [
      { label: "Mon", value: "mon" },
      { label: "Tue", value: "tue" },
      { label: "Wed", value: "wed" },
      { label: "Thu", value: "thu" },
      { label: "Fri", value: "fri" },
    ],
    multiple: true,
    size: "md",
  },
} satisfies StoryObj<typeof ToggleGroupComponent>;

export const Disabled = {
  args: {
    "aria-label": "Effort",
    defaultValue: ["3"],
    disabled: true,
    items: EFFORT,
    multiple: false,
    size: "md",
  },
} satisfies StoryObj<typeof ToggleGroupComponent>;
