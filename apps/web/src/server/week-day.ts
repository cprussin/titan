import { z } from "zod";

/** The fields every ribbon cell carries, whatever its kind: where the day sits
 *  in the calendar and how it labels. */
const weekDayBaseSchema = z.object({
  date: z.string(),
  dayOfWeek: z.number(),
  isPast: z.boolean(),
  isToday: z.boolean(),
  label: z.string(),
});

const restDaySchema = weekDayBaseSchema.extend({ kind: z.literal("rest") });
const plannedDaySchema = weekDayBaseSchema.extend({
  kind: z.literal("planned"),
  name: z.string(),
  /** The primary-movement signature shown on a collapsed cell. */
  signature: z.string().optional(),
  /** The exercise count and duration shown on an expanded cell. */
  summary: z.string(),
});
const loggedDaySchema = weekDayBaseSchema.extend({
  kind: z.literal("logged"),
  name: z.string(),
  /** The sets and actual duration shown on an expanded cell. */
  summary: z.string(),
});

/** One cell of the dashboard's week ribbon. Its `kind` says what to show — a
 *  rest day, a planned session, or a session already logged. Cells cross the
 *  wire (the ribbon lazy-loads adjacent weeks), so the schema is the source of
 *  truth and the string discriminant is the contract (see DATA.md). This module
 *  stays free of the program engine so the client bundle can parse cells without
 *  pulling it in. */
export const weekDaySchema = z.discriminatedUnion("kind", [
  restDaySchema,
  plannedDaySchema,
  loggedDaySchema,
]);

export type WeekDay = z.infer<typeof weekDaySchema>;

/** The common fields a cell constructor is handed before its kind-specific
 *  detail is added. */
export type WeekDayBase = z.infer<typeof weekDayBaseSchema>;

/** Constructors for each ribbon cell, so every producer builds a `WeekDay`
 *  through one place rather than scattering object literals. */
export const WeekDay = {
  Logged: (
    base: WeekDayBase,
    name: string,
    summary: string,
  ): z.infer<typeof loggedDaySchema> => ({
    ...base,
    kind: "logged",
    name,
    summary,
  }),
  Planned: (
    base: WeekDayBase,
    name: string,
    signature: string | undefined,
    summary: string,
  ): z.infer<typeof plannedDaySchema> => ({
    ...base,
    kind: "planned",
    name,
    signature,
    summary,
  }),
  Rest: (base: WeekDayBase): z.infer<typeof restDaySchema> => ({
    ...base,
    kind: "rest",
  }),
};
