import type { Decorated } from "./filter";

/**
 * Export saved articles as RIS or BibTeX, for importing into Zotero (or
 * EndNote, Mendeley, Papers — all of them read these two).
 *
 * This runs entirely in the browser. Nothing is uploaded, no Zotero account or
 * API key is involved, and it works the same for anyone using the app.
 *
 * What goes in a record: authors, year, title, journal, DOI, abstract,
 * keywords, and the article URL. What does NOT: volume, issue, and page
 * numbers — OpenAlex's biblio fields are unreliable for the online-first
 * articles that make up most of a 30-day window, and Zotero fills them in
 * from the DOI anyway when you hit "Update metadata".
 */

/** Only the full author list matters here, so take it from the card's data. */
function authorList(a: Decorated): string[] {
  return a.authors;
}

/* --------------------------------------------------------------------- RIS */

/**
 * RIS is a line-oriented format: `TAG  - value`, exactly two spaces before the
 * hyphen, one record per article, terminated by `ER  -`. Zotero's RIS importer
 * is strict about that spacing.
 */
export function toRIS(articles: Decorated[]): string {
  const lines: string[] = [];

  for (const a of articles) {
    // JOUR covers journal articles; OpenAlex "review" items are still journal
    // articles, so they use the same type rather than RIS's RPRT/CHAP.
    lines.push("TY  - JOUR");
    for (const name of authorList(a)) {
      lines.push(`AU  - ${toLastFirst(name)}`);
    }
    lines.push(`TI  - ${clean(a.title)}`);
    lines.push(`JO  - ${clean(a.journalName)}`);
    lines.push(`PY  - ${a.date.slice(0, 4)}`);
    // DA wants slashes, not hyphens, and a trailing separator for the season.
    lines.push(`DA  - ${a.date.replace(/-/g, "/")}/`);
    if (a.doi) {
      lines.push(`DO  - ${a.doi}`);
      lines.push(`UR  - https://doi.org/${a.doi}`);
    } else if (a.landingUrl) {
      lines.push(`UR  - ${a.landingUrl}`);
    }
    if (a.abstract) lines.push(`AB  - ${clean(a.abstract)}`);
    for (const k of a.keywords) lines.push(`KW  - ${clean(k)}`);
    lines.push("ER  - ");
    lines.push("");
  }

  return lines.join("\r\n");
}

/** "Jane Q. Smith" -> "Smith, Jane Q." — the form RIS and BibTeX both expect. */
function toLastFirst(full: string): string {
  const parts = full.trim().split(/\s+/);
  if (parts.length < 2) return full.trim();
  const last = parts.pop() as string;
  return `${last}, ${parts.join(" ")}`;
}

/** Strip the newlines that would break RIS's one-field-per-line structure. */
function clean(s: string): string {
  return s.replace(/\s*\r?\n\s*/g, " ").trim();
}

/* ----------------------------------------------------------------- BibTeX */

/**
 * BibTeX needs two things handled: a unique citation key per entry, and
 * braces around any title whose capitalisation must survive (BibTeX
 * lowercases titles under many styles, which would turn "ADHD" into "adhd").
 */
export function toBibTeX(articles: Decorated[]): string {
  const used = new Set<string>();
  const out: string[] = [];

  for (const a of articles) {
    const key = uniqueKey(a, used);
    const fields: [string, string][] = [
      ["author", authorList(a).map(toLastFirst).join(" and ")],
      // Double braces protect capitalisation across the whole title.
      ["title", `{${escapeTeX(clean(a.title))}}`],
      ["journal", escapeTeX(clean(a.journalName))],
      ["year", a.date.slice(0, 4)],
    ];
    if (a.doi) fields.push(["doi", a.doi], ["url", `https://doi.org/${a.doi}`]);
    else if (a.landingUrl) fields.push(["url", a.landingUrl]);
    if (a.abstract) fields.push(["abstract", escapeTeX(clean(a.abstract))]);
    if (a.keywords.length) fields.push(["keywords", escapeTeX(a.keywords.join(", "))]);

    const body = fields
      .filter(([, v]) => v)
      .map(([k, v]) => `  ${k} = {${v}}`)
      .join(",\n");
    out.push(`@article{${key},\n${body}\n}`);
  }

  return out.join("\n\n") + "\n";
}

function uniqueKey(a: Decorated, used: Set<string>): string {
  const first = a.authors[0] ?? "anon";
  const surname =
    (first.trim().split(/\s+/).pop() ?? "anon")
      .toLowerCase()
      .replace(/[^a-z]/g, "") || "anon";
  const year = a.date.slice(0, 4);
  const word =
    a.title
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .find((w) => w.length > 3 && !STOPWORDS.has(w)) ?? "untitled";

  const base = `${surname}${year}${word}`;
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  // Two papers by the same author, year, and first content word: suffix a, b…
  for (let i = 0; ; i++) {
    const candidate = `${base}${String.fromCharCode(97 + i)}`;
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
  }
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "into", "among", "between",
  "their", "about", "study", "using", "does", "when", "what", "role", "under",
]);

/** The five characters BibTeX treats as syntax rather than text. */
function escapeTeX(s: string): string {
  return s.replace(/([&%$#_])/g, "\\$1").replace(/[{}]/g, "");
}

/* -------------------------------------------------------------- download */

export function downloadFile(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function stamp(): string {
  return new Date().toISOString().slice(0, 10);
}
