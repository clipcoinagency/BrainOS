import { z } from "zod";

/** Below this length we don't search at all — too short to be selective,
 * and it would fire a query on effectively every keystroke. Shared by the
 * schema, the query hook's `enabled` gate, and the command palette's own
 * "show the Results group" check, so the three can't silently drift apart. */
export const MIN_SEARCH_QUERY_LENGTH = 2;

export const searchQuerySchema = z
  .string()
  .trim()
  .min(MIN_SEARCH_QUERY_LENGTH)
  .max(200);
