import { z } from "zod";

// Bounds year to a sane application range. Two reasons: (1) without a lower
// bound, a value in 0-99 (e.g. "0050-06") would later hit JS's Date
// constructor's legacy two-digit-year rule (0-99 -> 1900-1999) and silently
// render/query a completely different year with no error; (2) without an
// upper bound, grid-range math that adds up to 42 days past the displayed
// month could push year 9999 into a 5-digit year, breaking the "YYYY-MM-DD"
// shape callers (and the DB column) assume.
const MIN_YEAR = 1900;
const MAX_YEAR = 2200;

/** A "YYYY-MM" URL search-param value — reachable with arbitrary text
 * regardless of what the UI itself ever sends. */
export const monthParamSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Invalid month.")
  .transform((value) => {
    const [year, month] = value.split("-").map(Number);
    return { year, month };
  })
  .refine(({ month }) => month >= 1 && month <= 12, "Invalid month.")
  .refine(
    ({ year }) => year >= MIN_YEAR && year <= MAX_YEAR,
    "Year out of range.",
  );

export type MonthParam = z.infer<typeof monthParamSchema>;
