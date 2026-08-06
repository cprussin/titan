import type { Meta, StoryObj } from "@storybook/react-vite";

import type { AccordionItem } from "./Accordion";
import { Accordion as AccordionComponent } from "./Accordion";

const ITEMS: AccordionItem[] = [
  {
    content: "Back squat, Romanian deadlift, split squat.",
    trigger: "Monday",
    value: "mon",
  },
  { content: "Row intervals, easy spin.", trigger: "Tuesday", value: "tue" },
  {
    content: "Bench press, pull-ups, carries.",
    trigger: "Wednesday",
    value: "wed",
  },
];

const meta = {
  args: {
    items: ITEMS,
    multiple: false,
  },
  argTypes: {
    items: {
      control: false,
      table: { category: "Contents" },
    },
    multiple: {
      control: "boolean",
      table: { category: "Behavior" },
    },
  },
  component: AccordionComponent,
  parameters: {
    docs: {
      description: {
        component:
          "A vertical stack of disclosure rows wrapping the base-ui Accordion — expands one panel at a time (by default) with an accessible, height-animated collapse.",
      },
    },
  },
  tags: ["autodocs"],
  title: "Data Display/Accordion",
} satisfies Meta<typeof AccordionComponent>;
export default meta;

export const Accordion: StoryObj<typeof AccordionComponent> = {};

export const OpenMultiple: StoryObj<typeof AccordionComponent> = {
  args: { multiple: true },
  parameters: {
    docs: {
      description: {
        story: "With `multiple`, several panels can stay open at once.",
      },
    },
  },
};

export const WithDisabledItem: StoryObj<typeof AccordionComponent> = {
  args: {
    items: [
      {
        content: "Back squat, Romanian deadlift.",
        trigger: "Monday",
        value: "mon",
      },
      {
        content: "Not scheduled this block.",
        disabled: true,
        trigger: "Tuesday",
        value: "tue",
      },
      { content: "Bench press, pull-ups.", trigger: "Wednesday", value: "wed" },
    ],
  },
};
