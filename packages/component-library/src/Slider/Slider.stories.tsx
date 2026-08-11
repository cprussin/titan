import type { Meta, StoryObj } from "@storybook/react-vite";

import { Slider as SliderComponent } from "./Slider";

const meta = {
  args: {
    "aria-label": "Value",
    defaultValue: 5,
    disabled: false,
    max: 10,
    min: 1,
    step: 1,
  },
  argTypes: {
    "aria-label": {
      control: "text",
      table: { category: "Accessibility" },
    },
    defaultValue: {
      control: "number",
      table: { category: "Value" },
    },
    disabled: {
      control: "boolean",
      table: { category: "State" },
    },
    max: {
      control: "number",
      table: { category: "Range" },
    },
    min: {
      control: "number",
      table: { category: "Range" },
    },
    step: {
      control: "number",
      table: { category: "Range" },
    },
  },
  component: SliderComponent,
  parameters: {
    docs: {
      description: {
        component:
          "A horizontal single-thumb slider that wraps the @base-ui/react Slider primitive with the design tokens and forwards its label to the thumb.",
      },
    },
  },
  tags: ["autodocs"],
  title: "Forms & Inputs/Slider",
} satisfies Meta<typeof SliderComponent>;
export default meta;

export const Slider: StoryObj<typeof SliderComponent> = {
  args: {
    "aria-label": "Value",
    defaultValue: 5,
    disabled: false,
    max: 10,
    min: 1,
    step: 1,
  },
};

export const Disabled = {
  args: {
    "aria-label": "Value",
    defaultValue: 5,
    disabled: true,
    max: 10,
    min: 1,
    step: 1,
  },
} satisfies StoryObj<typeof SliderComponent>;
