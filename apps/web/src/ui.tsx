"use client";

// The @titan/component-library primitives use React hooks, so they must run on
// the client. This barrel is the single "use client" boundary that re-exports
// them for the app; pages (server components) render these as client children,
// which is the standard RSC composition pattern.

export { Accordion } from "@titan/component-library/Accordion";
export { Button } from "@titan/component-library/Button";
export { Card } from "@titan/component-library/Card";
export { Field } from "@titan/component-library/Field";
export { Input } from "@titan/component-library/Input";
export { ModalDialog } from "@titan/component-library/ModalDialog";
export { Provider } from "@titan/component-library/Provider";
export { Select } from "@titan/component-library/Select";
export { Textarea } from "@titan/component-library/Textarea";
export { ThemeSwitch } from "@titan/component-library/ThemeSwitch";
