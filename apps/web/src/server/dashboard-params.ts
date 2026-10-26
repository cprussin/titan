import { z } from "zod";

/** The dashboard's query: `date` selects a day, `week` pages the picker off the
 *  current week. Shared by the page and the Android app's endpoint. */
type Param = string | string[] | null | undefined;

const dateParamSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const weekParamSchema = z.coerce.number().int();

/** The selected day: a valid `date`, else today. */
export const selectDate = (param: Param, today: string): string => {
  const parsed = dateParamSchema.safeParse(param);
  return parsed.success ? parsed.data : today;
};

/** The shown week offset: a valid integer `week`, else the current week. */
export const selectWeek = (param: Param): number => {
  const parsed = weekParamSchema.safeParse(param);
  return parsed.success ? parsed.data : 0;
};
