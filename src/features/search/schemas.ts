import { z } from "zod";

/** Below this length we don't search at all — too short to be selective,
 * and it would fire a query on effectively every keystroke. */
export const searchQuerySchema = z.string().trim().min(2).max(200);
