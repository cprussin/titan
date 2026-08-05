# @titan/component-library

The shared React UI primitives every Titan app builds on. Components wrap
[`@base-ui/react`](https://base-ui.com) where a primitive exists — so focus
management, keyboard navigation, portals, and validation come from base-ui —
and add the project's styling and ergonomic API on top. This package also
owns the design system: the Panda CSS preset (tokens, the shared `control`
recipe) that every other package extends.

Apps MUST build on these primitives rather than rolling their own buttons,
inputs, or dialogs from raw HTML. If a primitive is missing, add it here and
consume it — don't fork. See [/docs/guidelines/STYLING.md](../../docs/guidelines/STYLING.md).

## Exports

| Export | What it is |
|---|---|
| `@titan/component-library/Button` | Polymorphic button (`<button>` / `<a>`), variants + sizes. |
| `@titan/component-library/Input` | Text input with prefix-icon / clearable / invalid states. |
| `@titan/component-library/Textarea` | Auto-sizing textarea with a resize handle. |
| `@titan/component-library/Field` | Label + control + validation-message wrapper (base-ui Field). |
| `@titan/component-library/Select` | Select / listbox (base-ui Select). |
| `@titan/component-library/Tabs` | Tabbed container (base-ui Tabs): config-driven `tabs` array, a sliding active underline, `size` variants, inset focus ring. |
| `@titan/component-library/ModalDialog` | Modal dialog with flattened `title` / `footer` / `trigger` API. |
| `@titan/component-library/Avatar` | Avatar with initials / gradient fallback. |
| `@titan/component-library/Kbd` | Keyboard-shortcut key cap. |
| `@titan/component-library/pandacss-preset` | The `titanPreset` every package's `panda.config.ts` extends. |

Styling goes through the theme defined in the preset
(`pandacss-preset.ts`) — `color`, `spacing`, `borderRadius`, etc. — with
both dark (default) and light (`data-theme="light"`) values. Component
variants are exposed as explicit props, never a `className` passthrough;
`data-*` attributes communicate variant/state to CSS.

## Conventions

- Every component has a Storybook story (`*.stories.tsx`) with `argTypes` for
  every prop.
- Every component has tests (`*.test.tsx`) using `bun:test` +
  `@testing-library/react`.
- Icons come from `@phosphor-icons/react/dist/ssr/<IconName>` (the
  `*Icon`-suffixed name), never the barrel — see
  [/docs/guidelines/ICONS.md](../../docs/guidelines/ICONS.md).

The rules for adding or changing a component (directory layout, base-ui
wrapping, props typing, the `control` recipe, storybook categories, testing)
live in [`docs/AGENTS.md`](./docs/AGENTS.md) and the topic docs it indexes.

## Scripts

```sh
bun run start:dev    # Storybook dev server on port 4000
bun run build:storybook  # build static Storybook
bun run prepare      # panda codegen (generates styled-system/)
bun run test:unit    # bun:test + happy-dom
bun run test:types   # tsc --noEmit
```
