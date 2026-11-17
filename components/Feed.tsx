"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { FeedResult } from "@/lib/openalex";
import {
  EMPTY_FILTERS,
  applyFilters,
  chipCounts,
  countActive,
  decorate,
  groupByReadStatus,
  groupByRecency,
  suggestKeywords,
  type FilterState,
} from "@/lib/filter";
import { LENSES, TOPIC_GROUPS } from "@/lib/topics";
import { JOURNALS } from "@/lib/journals";
import { savedStore, seenStore } from "@/lib/idStore";
import ArticleCard from "./ArticleCard";
import MultiSelect from "./MultiSelect";
import { downloadFile, stamp, toBibTeX, toRIS } from "@/lib/export";

export default function Feed({ feed }: { feed: FeedResult }) {
  const articles = useMemo(() => decorate(feed.articles), [feed.articles]);

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  // Collapsed by default: the full chip set is five rows tall and would push the
  // feed itself below the fold on every visit.
  const [showTopics, setShowTopics] = useState(false);
  const [showExport, setShowExport] = useState(false);

  // What you've read and saved lives in localStorage, which React treats as an
  // external store. The server snapshot is deliberately empty — the server has
  // no way to know, and saying so explicitly avoids a hydration mismatch.
  const seen = useSyncExternalStore(
    seenStore.subscribe,
    seenStore.getSnapshot,
    seenStore.getServerSnapshot,
  );
  const saved = useSyncExternalStore(
    savedStore.subscribe,
    savedStore.getSnapshot,
    savedStore.getServerSnapshot,
  );

  const topicPanelActive = filters.topics.length;

  function deselectAllTopics() {
    setFilters((f) => ({ ...f, topics: [] }));
  }

  function toggleIn(layer: "topics" | "keywords" | "journals", id: string) {
    setFilters((f) => {
      const cur = f[layer];
      return {
        ...f,
        [layer]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
      };
    });
  }

  function applyLens(lensId: string) {
    const lens = LENSES.find((l) => l.id === lensId);
    if (!lens) return;
    setFilters((f) => {
      const same =
        f.topics.length === lens.topics.length &&
        lens.topics.every((t) => f.topics.includes(t));
      // Clicking the lens you are already on clears it, so it reads as a toggle.
      if (same) return { ...f, topics: [] };
      return { ...f, topics: [...lens.topics] };
    });
  }

  const visible = useMemo(
    () => applyFilters(articles, filters, seen, saved),
    [articles, filters, seen, saved],
  );

  const topicCounts = useMemo(
    () => chipCounts(articles, filters, seen, saved, "topics"),
    [articles, filters, seen, saved],
  );
  const keywordCounts = useMemo(
    () => chipCounts(articles, filters, seen, saved, "keywords"),
    [articles, filters, seen, saved],
  );

  const suggested = useMemo(() => suggestKeywords(articles), [articles]);
  // Everything saved, regardless of the filters in force — the export is about
  // your saved list, not about what happens to be on screen.
  const savedArticles = useMemo(
    () => articles.filter((a) => saved.has(a.id)),
    [articles, saved],
  );
  const groups = useMemo(
    () =>
      filters.sort === "unread"
        ? groupByReadStatus(visible, seen)
        : groupByRecency(visible),
    [visible, filters.sort, seen],
  );
  const active = countActive(filters);

  const activeLens = LENSES.find(
    (l) =>
      l.topics.length === filters.topics.length &&
      l.topics.every((t) => filters.topics.includes(t)),
  );

  return (
    <>
      <header className="masthead">
        <div className="shell">
          <p className="kicker">Child, family, &amp; clinical psychology</p>
          <h1>Research Digest</h1>
          <p className="sub">
            Everything published in the last 30 days across {JOURNALS.length} journals,
            pulled from OpenAlex. Filter by clicking — the topics below come from
            OpenAlex&rsquo;s own classification of each article.
          </p>
          <div className="statbar">
            <span className="stat">
              <b>{articles.length}</b>
              <span>articles this month</span>
            </span>
            <span className="stat">
              <b>{saved.size}</b>
              <span>saved</span>
            </span>
            <span className="stat">
              <b>{JOURNALS.length}</b>
              <span>journals followed</span>
            </span>
          </div>
        </div>
      </header>

      <div className="shell">
        {feed.error && (
          <div className="notice">
            <strong>OpenAlex didn&rsquo;t answer.</strong> {feed.error} The feed will try
            again on the next page load.
          </div>
        )}

        {/* ------------------------------------------------ lenses */}
        <section className="panel">
          <div className="panel-head">
            <h2>Saved lenses</h2>
            {activeLens && (
              <button className="linkbtn" onClick={() => applyLens(activeLens.id)}>
                Clear lens
              </button>
            )}
          </div>
          <p className="hint">
            One click applies a whole set of topics at once. Edit or add your own in{" "}
            <span className="mono">lib/topics.ts</span>.
          </p>
          <div className="lensrow">
            {LENSES.map((l) => (
              <button
                key={l.id}
                className="lens"
                data-on={activeLens?.id === l.id}
                onClick={() => applyLens(l.id)}
              >
                <strong>{l.label}</strong>
                <span>{l.blurb}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------ topics */}
        <section className="panel">
          <div className="panel-head">
            <h2>Topics</h2>
            <div className="right">
              {topicPanelActive > 0 && (
                <>
                  <span className="filter-summary">
                    <b>{topicPanelActive}</b> selected
                  </span>
                  <button className="linkbtn" onClick={deselectAllTopics}>
                    Deselect all
                  </button>
                </>
              )}
              <button
                className="btn btn-quiet"
                aria-expanded={showTopics}
                aria-controls="topic-chips"
                onClick={() => setShowTopics((v) => !v)}
              >
                {showTopics ? "Hide topics" : "Show topics"}
              </button>
            </div>
          </div>

          {/* The description sits outside the collapsible region so it explains
              the section even while the chips are hidden. */}
          <p className="hint">
            These are OpenAlex Topics, not word searches — an article is tagged
            &ldquo;ADHD&rdquo; because OpenAlex classified it that way, whether or not it
            uses the word. The number on each chip is how many of this
            month&rsquo;s articles it would bring in. Within a row, chips add up
            (<b>or</b>). Across rows, they narrow (<b>and</b>).
          </p>

          {/* Kept mounted but hidden, so chip state and scroll position survive
              a collapse — and so the selected count above stays truthful. */}
          <div id="topic-chips" hidden={!showTopics}>
            {TOPIC_GROUPS.map((g) => (
              <div key={g.name}>
                <span className="group-label">{g.name}</span>
                <div className="chiprow">
                  {g.topics.map((t) => {
                    const n = topicCounts.get(t.id) ?? 0;
                    return (
                      <button
                        key={t.id}
                        className="chip"
                        data-accent={g.accent}
                        data-on={filters.topics.includes(t.id)}
                        data-empty={n === 0}
                        title={`OpenAlex topic: ${t.openAlexName}`}
                        aria-pressed={filters.topics.includes(t.id)}
                        onClick={() => toggleIn("topics", t.id)}
                      >
                        {t.label}
                        <span className="count">{n}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* --------------------------------- keywords + journals, side by side */}
        <div className="panel-row">
          <section className="panel">
            <div className="panel-head">
              <h2>Journals</h2>
              <div className="right">
                <MultiSelect
                  placeholder={`All ${JOURNALS.length} journals`}
                  noun="journal"
                  options={JOURNALS.map((j) => ({
                    value: j.id,
                    label: j.name,
                    count: articles.filter((a) => a.journalId === j.id).length,
                  }))}
                  selected={filters.journals}
                  onToggle={(v) => toggleIn("journals", v)}
                  onClear={() => setFilters((f) => ({ ...f, journals: [] }))}
                />
              </div>
            </div>
            <p className="hint">
              Results from all journals are automatically displayed. Check a few to
              narrow the feed.
            </p>
          </section>

          {suggested.length > 0 && (
            <section className="panel">
              <div className="panel-head">
                <h2>Hot this month</h2>
                <div className="right">
                  <MultiSelect
                    placeholder="Pick keywords"
                    noun="keyword"
                    options={suggested.map((s) => ({
                      value: s.key,
                      label: s.label,
                      count: keywordCounts.get(s.key) ?? 0,
                    }))}
                    selected={filters.keywords}
                    onToggle={(v) => toggleIn("keywords", v)}
                    onClear={() => setFilters((f) => ({ ...f, keywords: [] }))}
                  />
                </div>
              </div>
              <p className="hint">
                The keywords OpenAlex attached to this month&rsquo;s articles, most
                common first. This list changes with the feed, so it might contain
                some terms you haven&rsquo;t thought to search for.
              </p>
            </section>
          )}
        </div>

        {/* ------------------------------------------------ toolbar */}
        <div className="toolbar">
          <div className="segmented">
            {(["all", "unseen", "saved"] as const).map((s) => (
              <button
                key={s}
                data-on={filters.status === s}
                onClick={() => setFilters((f) => ({ ...f, status: s }))}
              >
                {s === "all" ? "All" : s === "unseen" ? "Unread" : "Saved"}
              </button>
            ))}
          </div>

          <div className="right">
            <button
              className="chip"
              data-accent="amber"
              data-on={filters.access === "oa"}
              aria-pressed={filters.access === "oa"}
              onClick={() =>
                setFilters((f) => ({ ...f, access: f.access === "oa" ? "any" : "oa" }))
              }
            >
              Open access only
            </button>
            <label className="sortby">
              <span>Sort</span>
              <select
                value={filters.sort}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    sort: e.target.value as FilterState["sort"],
                  }))
                }
              >
                <option value="date">Newest first</option>
                <option value="unread">Unread first</option>
              </select>
            </label>
            <span className="filter-summary">
              <b>{visible.length}</b> of <b>{articles.length}</b> shown
              {active > 0 && ` · ${active} filter${active === 1 ? "" : "s"} on`}
            </span>
            <button
              className="btn btn-quiet"
              disabled={active === 0}
              onClick={() => setFilters((f) => ({ ...EMPTY_FILTERS, status: f.status }))}
            >
              Clear filters
            </button>
          </div>
        </div>

        {/* Export sits under the toolbar rather than in it: it acts on what
            you have saved, not on what the filters are currently showing. */}
        {savedArticles.length > 0 && (
          <div className="exportbar">
            <div className="panel-head">
              <h2>
                Send your {savedArticles.length} saved{" "}
                {savedArticles.length === 1 ? "article" : "articles"} to a reference
                manager
              </h2>
              <button
                className="btn btn-quiet"
                aria-expanded={showExport}
                aria-controls="export-steps"
                onClick={() => setShowExport((v) => !v)}
              >
                {showExport ? "Hide" : "How it works"}
              </button>
            </div>

            <div id="export-steps" hidden={!showExport}>
              <p className="exportintro">
                Download a file here, then import it into your reference manager —
                it will create a record for each article, with authors, title,
                journal, year, DOI, abstract, and keywords already filled in.
              </p>
              <ol>
                <li>
                  As you skim through articles, save the ones that you are
                  interested in.
                </li>
                <li>
                  Pick a format. <b>RIS</b> works nearly everywhere — Zotero,
                  EndNote, Mendeley, Papers, RefWorks. <b>BibTeX</b> is for LaTeX
                  and Overleaf.
                </li>
                <li>Download the file.</li>
                <li>
                  Import it: <em>Zotero</em> File &rarr; Import; <em>EndNote</em>{" "}
                  File &rarr; Import &rarr; choose &ldquo;Reference Manager
                  (RIS)&rdquo;; <em>Mendeley</em> File &rarr; Add Files; most others
                  have an Import under File.
                </li>
              </ol>
            </div>
            <button
              className="btn btn-quiet"
              onClick={() =>
                downloadFile(
                  `research-digest-${stamp()}.ris`,
                  toRIS(savedArticles),
                  "application/x-research-info-systems",
                )
              }
            >
              Download RIS
            </button>
            <button
              className="btn btn-quiet"
              onClick={() =>
                downloadFile(
                  `research-digest-${stamp()}.bib`,
                  toBibTeX(savedArticles),
                  "application/x-bibtex",
                )
              }
            >
              Download BibTeX
            </button>
            <p className="exporthint" hidden={!showExport}>
              Volume, issue, and page numbers are left out on purpose — for
              online-first articles those are often wrong or missing in OpenAlex.
              Your reference manager can fill them in from the DOI (in Zotero,
              right-click &rarr; <em>Update metadata</em>). The file holds
              reference details only, not the articles themselves — use the{" "}
              <b>PDF</b> link on an open-access article for that.
            </p>
          </div>
        )}

        {/* ------------------------------------------------ feed */}
        {visible.length === 0 ? (
          <div className="empty">
            <h3>Nothing matches those filters</h3>
            <p>
              {articles.length === 0
                ? "No articles came back from OpenAlex for the last 30 days."
                : "Try removing a chip — chips in different rows narrow the feed, not widen it."}
            </p>
          </div>
        ) : (
          groups.map((g) => (
            <section key={g.label}>
              <h2 className="datehead">
                {g.label} ({g.items.length})
              </h2>
              {g.items.map((a) => (
                <ArticleCard
                  key={a.id}
                  article={a}
                  seen={seen.has(a.id)}
                  saved={saved.has(a.id)}
                  activeTopics={filters.topics}
                  activeKeywords={filters.keywords}
                  onToggleSeen={seenStore.toggle}
                  onToggleSaved={savedStore.toggle}
                />
              ))}
            </section>
          ))
        )}

        <footer className="foot">
          <p>
            Data from <a href="https://openalex.org">OpenAlex</a>, refreshed hourly.
            Window: articles published since {feed.since}. What you&rsquo;ve read and
            saved is stored only in this browser — it never leaves your machine and
            doesn&rsquo;t sync between devices.
          </p>
        </footer>
      </div>
    </>
  );
}
