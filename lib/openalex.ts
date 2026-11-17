import { JOURNALS, JOURNALS_BY_ID } from "./journals";

/**
 * OpenAlex client. Runs server-side only, so the whole month's worth of
 * articles is fetched once, cached, and handed to the client as one payload —
 * every filter in the UI then acts on that payload instantly, with no refetch.
 *
 * No API key is set. Anonymous requests share a small daily budget per IP
 * (~1,000 calls/day), which is far more than this app uses at one cached
 * request per hour. To add a personal key later, set OPENALEX_API_KEY in the
 * environment — nothing else needs to change.
 */

const API = "https://api.openalex.org/works";

/** How far back the feed reaches. The brief: articles from the last month. */
export const WINDOW_DAYS = 30;

/** Work types worth reading. Excludes errata, paratext, supplementary files. */
const KEPT_TYPES = new Set(["article", "review", "preprint", "book-chapter"]);

export type Article = {
  id: string;
  doi: string | null;
  title: string;
  abstract: string | null;
  authors: string[];
  /** Full author list length, so the card can say "+4 more" honestly. */
  authorCount: number;
  journalId: string;
  journalName: string;
  date: string;
  type: string;
  isOA: boolean;
  oaUrl: string | null;
  /** A direct link to the PDF where OpenAlex knows one, for open-access work. */
  pdfUrl: string | null;
  landingUrl: string | null;
  /** OpenAlex Topic IDs, used by the topic chips. */
  topicIds: string[];
  topicNames: string[];
  /** OpenAlex keywords — the source for the auto-suggested chips. */
  keywords: string[];
  citedBy: number;
};

type OAWork = {
  id: string;
  doi: string | null;
  title: string | null;
  display_name: string | null;
  publication_date: string;
  type: string;
  cited_by_count: number;
  abstract_inverted_index: Record<string, number[]> | null;
  authorships: { author: { display_name: string } }[];
  primary_location: {
    source: { id: string; display_name: string } | null;
    landing_page_url: string | null;
    pdf_url: string | null;
  } | null;
  open_access: { is_oa: boolean; oa_url: string | null };
  best_oa_location: { pdf_url: string | null; landing_page_url: string | null } | null;
  topics: { id: string; display_name: string }[];
  keywords: { display_name: string }[];
};

/**
 * OpenAlex ships abstracts as an inverted index (word -> positions) rather than
 * plain text, for licensing reasons. Rebuild the prose by placing each word at
 * each of its positions.
 */
function rebuildAbstract(idx: Record<string, number[]> | null): string | null {
  if (!idx) return null;
  const slots: string[] = [];
  for (const [word, positions] of Object.entries(idx)) {
    for (const p of positions) slots[p] = word;
  }
  const text = slots.filter(Boolean).join(" ").trim();
  if (text.length < 40) return null;
  // Some publishers prefix the abstract with a literal "Abstract" heading.
  return text.replace(/^(Abstract|ABSTRACT|Summary)[:\s]+/, "");
}

function windowStart(days = WINDOW_DAYS): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

const SELECT = [
  "id",
  "doi",
  "title",
  "display_name",
  "publication_date",
  "type",
  "cited_by_count",
  "abstract_inverted_index",
  "authorships",
  "primary_location",
  "open_access",
  "best_oa_location",
  "topics",
  "keywords",
].join(",");

function normalize(w: OAWork): Article | null {
  const source = w.primary_location?.source;
  if (!source) return null;
  const journal = JOURNALS_BY_ID.get(source.id.split("/").pop() ?? "");
  if (!journal) return null;

  const title = (w.title ?? w.display_name ?? "").trim();
  if (!title) return null;

  const authors = w.authorships.map((a) => a.author.display_name);

  return {
    id: w.id.split("/").pop() ?? w.id,
    doi: w.doi ? w.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, "") : null,
    title,
    abstract: rebuildAbstract(w.abstract_inverted_index),
    authors: authors.slice(0, 6),
    authorCount: authors.length,
    journalId: journal.id,
    journalName: journal.name,
    date: w.publication_date,
    type: w.type,
    isOA: w.open_access?.is_oa ?? false,
    oaUrl: w.open_access?.oa_url ?? w.primary_location?.pdf_url ?? null,
    // best_oa_location is the freely readable copy OpenAlex considers best —
    // often a repository (PMC) rather than the publisher. Its pdf_url is a
    // direct file link; oa_url is sometimes only a landing page.
    pdfUrl:
      w.best_oa_location?.pdf_url ?? w.primary_location?.pdf_url ?? null,
    landingUrl: w.primary_location?.landing_page_url ?? (w.doi ?? null),
    topicIds: (w.topics ?? []).map((t) => t.id.split("/").pop() ?? t.id),
    topicNames: (w.topics ?? []).map((t) => t.display_name),
    keywords: (w.keywords ?? []).map((k) => k.display_name),
    citedBy: w.cited_by_count,
  };
}

export type FeedResult = {
  articles: Article[];
  fetchedAt: string;
  since: string;
  /** Null when everything went through; a message when OpenAlex was unhappy. */
  error: string | null;
};

export async function fetchFeed(): Promise<FeedResult> {
  const since = windowStart();
  const sourceFilter = JOURNALS.map((j) => j.id).join("|");
  const filter = `primary_location.source.id:${sourceFilter},from_publication_date:${since}`;

  const key = process.env.OPENALEX_API_KEY;
  const articles: Article[] = [];

  try {
    // Basic page paging, deliberately not cursor paging: OpenAlex now rejects
    // `cursor=` past the first page without an API key (401, "API key required
    // for cursor paging"), while `page=` stays open to anonymous callers up to
    // 10,000 results. This window is ~250 works, so it is two or three round
    // trips. The cap is a guard against a runaway loop, not a limit we expect
    // to reach.
    const PER_PAGE = 200;
    for (let page = 1; page <= 8; page++) {
      const url = new URL(API);
      url.searchParams.set("filter", filter);
      url.searchParams.set("select", SELECT);
      url.searchParams.set("per-page", String(PER_PAGE));
      url.searchParams.set("page", String(page));
      url.searchParams.set("sort", "publication_date:desc");
      if (key) url.searchParams.set("api_key", key);

      // `no-store` on purpose. The raw OpenAlex response is ~3 MB, over Next's
      // 2 MB per-entry fetch-cache limit, so caching it here fails and logs an
      // error on every load. Caching happens one level up instead, on the
      // "use cache" function, where the value being stored is the normalized
      // article list — a fraction of the size.
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new Error(
          `OpenAlex returned ${res.status} ${res.statusText}. ${body.slice(0, 200)}`,
        );
      }

      const data = (await res.json()) as { results: OAWork[] };

      for (const w of data.results) {
        if (!KEPT_TYPES.has(w.type)) continue;
        const a = normalize(w);
        if (a) articles.push(a);
      }

      if (data.results.length < PER_PAGE) break;
    }
  } catch (err) {
    return {
      articles: [],
      fetchedAt: new Date().toISOString(),
      since,
      error: err instanceof Error ? err.message : "Could not reach OpenAlex.",
    };
  }

  // A handful of works land in OpenAlex twice under different IDs; collapse on
  // DOI where there is one, falling back to a normalized title.
  const seen = new Set<string>();
  const deduped = articles.filter((a) => {
    const k = a.doi ?? a.title.toLowerCase().replace(/[^a-z0-9]+/g, "");
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  deduped.sort((a, b) => b.date.localeCompare(a.date));

  return {
    articles: deduped,
    fetchedAt: new Date().toISOString(),
    since,
    error: null,
  };
}
