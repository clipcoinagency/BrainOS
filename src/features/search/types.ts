export type SearchResultType = "note" | "task" | "goal" | "project" | "journal";

export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  subtitle: string;
  href: string;
}
