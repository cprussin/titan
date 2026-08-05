import { DocsContainer } from "@storybook/addon-docs/blocks";
import { withThemeByClassName } from "@storybook/addon-themes";
import type { Preview } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import { themes } from "storybook/theming";

import "./storybook.css";

// Wraps the default DocsContainer with a theme that follows the
// `addon-themes` selection. The decorator below sets a `theme` global
// (values: `"dark"` | `"light"`); we subscribe to channel events so the
// docs CHROME (table of contents, prose colors, prop tables) switches
// alongside the story canvas.
const ThemedDocsContainer = ({
  context,
  children,
}: ComponentProps<typeof DocsContainer>) => {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  useEffect(() => {
    const handle = (payload: { globals?: Record<string, unknown> }) => {
      const next = payload.globals?.theme;
      if (next === "light" || next === "dark") {
        setTheme(next);
      }
    };
    context.channel.on("setGlobals", handle);
    context.channel.on("globalsUpdated", handle);
    return () => {
      context.channel.off("setGlobals", handle);
      context.channel.off("globalsUpdated", handle);
    };
  }, [context.channel]);

  return (
    <DocsContainer
      context={context}
      theme={theme === "light" ? themes.normal : themes.dark}
    >
      {children}
    </DocsContainer>
  );
};

const preview = {
  decorators: [
    // Mirror the renderer's theming mechanism: light = `.light` class on
    // the document root, dark = no class (the `base` value in the titan
    // Panda preset). Matches Panda's built-in `_light` condition selector
    // `.light &`.
    withThemeByClassName({
      defaultTheme: "dark",
      themes: { dark: "", light: "light" },
    }),
  ],
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: { disableSaveFromUI: true },
    docs: {
      container: ThemedDocsContainer,
    },
    layout: "centered",
    options: {
      storySort: {
        order: [
          "Layout",
          "Navigation",
          "Forms & Inputs",
          "Data Display",
          "Overlays",
          "Trading",
        ],
      },
    },
  },
} satisfies Preview;
export default preview;
