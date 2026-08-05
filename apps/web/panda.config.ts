import { defineConfig } from "@pandacss/dev";
import { titanPreset } from "@titan/component-library/pandacss-preset";

export default defineConfig({
  exclude: [],
  // `hash: true` matches the component-library's own Panda config so the class
  // names its components emit at runtime line up with the CSS rules generated
  // here. Including the component-library source in `include` is what pulls
  // those rules into this app's bundle (see docs/guidelines/STYLING.md).
  hash: true,
  include: [
    "./src/**/*.{ts,tsx}",
    "../../packages/component-library/src/**/*.{ts,tsx}",
  ],
  jsxFramework: "react",
  outdir: "styled-system",
  preflight: true,
  presets: [titanPreset],
});
