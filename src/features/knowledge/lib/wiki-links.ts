const WIKI_LINK_PATTERN = /\[\[([^[\]]+)\]\]/g;

/** Extract every `[[Title]]` reference from an article's content, trimmed
 * and deduplicated (order of first appearance). */
export function extractWikiLinks(content: string): string[] {
  const titles: string[] = [];
  const seen = new Set<string>();

  for (const match of content.matchAll(WIKI_LINK_PATTERN)) {
    const title = match[1]?.trim();
    if (!title) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    titles.push(title);
  }

  return titles;
}

/** Escape ILIKE's own wildcard characters (`%`, `_`) so a title containing
 * them is matched literally. Postgres's default ILIKE escape character is
 * `\`. Duplicated (in miniature) from the search feature's own
 * `escapeLikePattern` rather than imported — features only share code
 * through `src/lib`/`src/components`/`src/hooks`, never by reaching into
 * another feature's internals. */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (match) => `\\${match}`);
}

/** The ILIKE pattern that matches any content containing a `[[title]]`
 * reference to the given title (case-insensitive, exact title text). */
export function wikiLinkPattern(title: string): string {
  return `%[[${escapeLikePattern(title)}]]%`;
}
