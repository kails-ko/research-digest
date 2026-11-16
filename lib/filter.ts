import type { Article } from "./openalex";
import { DESIGN_TAGS } from "./topics";

/** Title + abstract, lowercased once per article and reused by every tag. */
function haystack(a: Article): string {
  return `${a.title} ${a.abstract ?? ""}`.toLowerCase();
}

/**
 * Which design tags an article matches. Computed once when the feed loads,
 * not on every keystroke — there are no keystrokes.
 */
export function designTagsFor(a: Article): string[] {
  const text = haystack(a);
  return DESIGN_TAGS.filter((t) => t.patterns.some((p) => p.test(text))).map((t) => t.id);
}

export type Decorated = Article & {
  designIds: string[];
  /** Lowercased OpenAlex keywords, for the auto-suggested chip layer. */
  keywordKeys: string[];
};

export function decorate(articles: Article[]): Decorated[] {
  return articles.map((a) => ({
    ...a,
    designIds: designTagsFor(a),
    keywordKeys: a.keywords.map((k) => k.toLowerCase()),
  }));
}

/**
 * The auto-suggested chips: the OpenAlex keywords that actually occur across
 * this month's articles, most common first. This is the layer that means you
 * never have to guess a term — the feed tells you what is in it.
 */
export function suggestKeywords(articles: Decorated[], limit = 24) {
  const counts = new Map<string, { label: string; n: number }>();
  for (const a of articles) {
    // A keyword repeated on one article still only counts once for that article.
    const unique = new Set(a.keywordKeys);
    for (const k of unique) {
      const label = a.keywords[a.keywordKeys.indexOf(k)] ?? k;
      const cur = counts.get(k);
      if (cur) cur.n += 1;
      else counts.set(k, { label, n: 1 });
    }
  }
  return [...counts.entries()]
    .filter(([, v]) => v.n > 1) // a keyword on a single article is noise
    .sort((a, b) => b[1].n - a[1].n || a[1].label.localeCompare(b[1].label))
    .slice(0, limit)
    .map(([key, v]) => ({ key, label: v.label, count: v.n }));
}

export type FilterState = {
  topics: string[];
  designs: string[];
  keywords: string[];
  journals: string[];
  /** "any" keeps everything; "oa" keeps only open-access articles. */
  access: "any" | "oa";
  status: "all" | "unseen" | "saved";
};

export const EMPTY_FILTERS: FilterState = {
  topics: [],
  designs: [],
  keywords: [],
  journals: [],
  access: "any",
  status: "all",
};

export function countActive(f: FilterState): number {
  return (
    f.topics.length +
    f.designs.length +
    f.keywords.length +
    f.journals.length +
    (f.access === "oa" ? 1 : 0)
  );
}

/**
 * Filtering rule, chosen deliberately: chips *within* a layer are OR'd, and the
 * layers are AND'd together. So picking ADHD + Autism widens the feed, while
 * picking ADHD + "Randomized trial" narrows it. That matches how you would say
 * it out loud — "ADHD or autism work, but only the trials."
 */
export function applyFilters(
  articles: Decorated[],
  f: FilterState,
  seen: ReadonlySet<string>,
  saved: ReadonlySet<string>,
): Decorated[] {
  return articles.filter((a) => {
    if (f.topics.length && !a.topicIds.some((t) => f.topics.includes(t))) return false;
    if (f.designs.length && !a.designIds.some((d) => f.designs.includes(d))) return false;
    if (f.keywords.length && !a.keywordKeys.some((k) => f.keywords.includes(k))) return false;
    if (f.journals.length && !f.journals.includes(a.journalId)) return false;
    if (f.access === "oa" && !a.isOA) return false;
    if (f.status === "unseen" && seen.has(a.id)) return false;
    if (f.status === "saved" && !saved.has(a.id)) return false;
    return true;
  });
}

/**
 * How many articles a chip would bring in, counted against everything *except*
 * that chip's own layer — so the number on a chip tells you what you'd get by
 * clicking it, not what you have now.
 */
export function chipCounts(
  articles: Decorated[],
  f: FilterState,
  seen: ReadonlySet<string>,
  saved: ReadonlySet<string>,
  layer: "topics" | "designs" | "keywords",
) {
  const base = applyFilters(articles, { ...f, [layer]: [] }, seen, saved);
  const counts = new Map<string, number>();
  for (const a of base) {
    const keys =
      layer === "topics" ? a.topicIds : layer === "designs" ? a.designIds : a.keywordKeys;
    for (const k of new Set(keys)) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

/** Group by ISO week-ish buckets, newest first, for the date headers. */
export function groupByRecency(articles: Decorated[]) {
  const now = new Date();
  const dayMs = 86_400_000;
  const buckets: { label: string; items: Decorated[] }[] = [
    { label: "This week", items: [] },
    { label: "Last week", items: [] },
    { label: "Two weeks ago", items: [] },
    { label: "Earlier this month", items: [] },
  ];

  for (const a of articles) {
    const age = Math.floor((now.getTime() - new Date(`${a.date}T12:00:00Z`).getTime()) / dayMs);
    const i = age <= 7 ? 0 : age <= 14 ? 1 : age <= 21 ? 2 : 3;
    buckets[i].items.push(a);
  }

  return buckets.filter((b) => b.items.length > 0);
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
