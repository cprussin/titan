import type { Meta, StoryObj } from "@storybook/react-vite";
import { css } from "../../styled-system/css";

import { Breadcrumbs as BreadcrumbsComponent } from "./Breadcrumbs";

const meta = {
  args: {
    crumbs: [
      { href: "/programs", label: "Programs" },
      { href: "/programs/strength", label: "Strength" },
    ],
  },
  component: BreadcrumbsComponent,
  decorators: [
    (Story) => (
      <div className={css({ alignItems: "center", display: "flex", gap: 1.5 })}>
        <Story />
        <span className={css({ fontSize: "sm", fontWeight: "semibold" })}>
          Block A
        </span>
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "A trail of ancestor links with caret separators. The trailing caret leads into the current page's title, shown here after the trail.",
      },
    },
  },
  tags: ["autodocs"],
  title: "Navigation/Breadcrumbs",
} satisfies Meta<typeof BreadcrumbsComponent>;
export default meta;

export const Breadcrumbs: StoryObj<typeof BreadcrumbsComponent> = {};

export const SingleCrumb: StoryObj<typeof BreadcrumbsComponent> = {
  args: { crumbs: [{ href: "/", label: "Today" }] },
};

export const WithPlainCrumb: StoryObj<typeof BreadcrumbsComponent> = {
  args: {
    crumbs: [{ href: "/programs", label: "Programs" }, { label: "Strength" }],
  },
};

// A deeper trail shows the responsive behavior: below `md` the inline trail is
// replaced by an overflow button (`…`) that opens the ancestors in a popover
// menu. Narrow the viewport and click the button to see it.
export const DeepTrail: StoryObj<typeof BreadcrumbsComponent> = {
  args: {
    crumbs: [
      { href: "/programs", label: "Programs" },
      { href: "/programs/strength", label: "Strength" },
      { href: "/programs/strength/hypertrophy", label: "Hypertrophy" },
      { href: "/programs/strength/hypertrophy/week-3", label: "Week 3" },
    ],
  },
};
