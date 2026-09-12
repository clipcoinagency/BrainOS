import { Frown, Laugh, Meh, Smile, SmilePlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { JournalMood } from "@/lib/supabase/types";

/** Every mood, worst to best — the order the picker renders them in. */
export const MOODS: JournalMood[] = ["rough", "low", "okay", "good", "great"];

export const MOOD_LABEL: Record<JournalMood, string> = {
  great: "Great",
  good: "Good",
  okay: "Okay",
  low: "Low",
  rough: "Rough",
};

export const MOOD_ICON: Record<JournalMood, LucideIcon> = {
  great: Laugh,
  good: SmilePlus,
  okay: Smile,
  low: Meh,
  rough: Frown,
};

/** Text color per mood, from the design tokens — matches the badge approach
 * used by goals/projects status. */
export const MOOD_COLOR_CLASSNAME: Record<JournalMood, string> = {
  great: "text-chart-3",
  good: "text-chart-3",
  okay: "text-muted-foreground",
  low: "text-chart-4",
  rough: "text-destructive",
};
