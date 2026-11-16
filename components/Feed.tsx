"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import type { FeedResult } from "@/lib/openalex";
import {
  EMPTY_FILTERS,
  applyFilters,
  chipCounts,
  countActive,
  decorate,
  groupByRecency,
  suggestKeywords,
  type FilterState,
} from "@/lib/filter";
import { DESIGN_TAGS, LENSES, TOPIC_GROUPS } from "@/lib/topics";
import { JOURNALS } from "@/lib/journals";
import { savedStore, seenStore } from "@/lib/idStore";
import ArticleCard from "./ArticleCard";

export default function Feed({ feed }: { feed: FeedResult }) {
  const articles = useMemo(() => decorate(feed.articles), [feed.articles]);

  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [showJournals, setShowJournals] = useState(false);
  // Collapsed by default: the full chip set is five rows tall and would push the
  // feed itself below the fold on every visit.
  const [showTopics, setShowTopics] = useState(false);

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

  /** Both chip rows in the Topics panel, so "Deselect all" clears what you see. */
  const topicPanelActive = filters.topics.length + filters.designs.length;

  function deselectAllTopics() {
    setFilters((f) => ({ ...f, topics: [], designs: [] }));
  }

  function toggleIn(layer: "topics" | "designs" | "keywords" | "journals", id: string) {
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
        lens.topics.every((t) => f.topics.includes(t)) &&
        (lens.designs ?? []).every((d) => f.designs.includes(d));
      // Clicking the lens you are already on clears it, so it reads as a toggle.
      if (same) return { ...f, topics: [], designs: [] };
      return { ...f, topics: [...lens.topics], designs: [...(lens.designs ?? [])] };
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
  const designCounts = useMemo(
    () => chipCounts(articles, filters, seen, saved, "designs"),
    [articles, filters, seen, saved],
  );
  const keywordCounts = useMemo(
    () => chipCounts(articles, filters, seen, saved, "keywords"),
    [articles, filters, seen, saved],
  );

  const suggested = useMemo(() => suggestKeywords(articles), [articles]);
  const groups = useMemo(() => groupByRecency(visible), [visible]);
  const unseenCount = articles.filter((a) => !seen.has(a.id)).length;
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
          <p className="kicker">Child, family &amp; clinical psychology</p>
          <h1>Research Feed</h1>
          <p className="sub">
            Everything published in the last 30 days across {JOURNALS.length} journals,
            pulled from OpenAlex. Filter by clicking — the topics below come from
            OpenAlex&rsquo;s own classification of each article, so there is nothing to
            type and nothing to spell right.
          </p>
          <div className="statbar">
            <span className="stat">
              <b>{articles.length}</b>
              <span>articles this month</span>
            </span>
            <span className="stat">
              <b>{unseenCount}</b>
              <span>unread</span>
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

          {/* Kept mounted but hidden, so chip state and scroll position survive
              a collapse — and so the selected count above stays truthful. */}
          <div id="topic-chips" hidden={!showTopics}>
              <p className="hint">
                These are OpenAlex Topics, not word searches — an article is tagged
                &ldquo;ADHD&rdquo; because OpenAlex classified it that way, whether or not
                it uses the word. The number on each chip is how many of this
                month&rsquo;s articles it would bring in. Within a row, chips add up
                (<b>or</b>). Across rows, they narrow (<b>and</b>).
              </p>

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

            <span className="group-label">Study design</span>
            <div className="chiprow">
              {DESIGN_TAGS.map((d) => {
                const n = designCounts.get(d.id) ?? 0;
                return (
                  <button
                    key={d.id}
                    className="chip"
                    data-accent="pink"
                    data-on={filters.designs.includes(d.id)}
                    data-empty={n === 0}
                    aria-pressed={filters.designs.includes(d.id)}
                    onClick={() => toggleIn("designs", d.id)}
                  >
                    {d.label}
                    <span className="count">{n}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ suggested */}
        {suggested.length > 0 && (
          <section className="panel">
            <h2>Showing up this month</h2>
            <p className="hint">
              The keywords OpenAlex attached to this month&rsquo;s articles, most common
              first. This row changes with the feed, so it surfaces terms you
              wouldn&rsquo;t have thought to search for.
            </p>
            <div className="chiprow">
              {suggested.map((s) => {
                const n = keywordCounts.get(s.key) ?? 0;
                return (
                  <button
                    key={s.key}
                    className="chip"
                    data-accent="pistachio"
                    data-on={filters.keywords.includes(s.key)}
                    data-empty={n === 0}
                    aria-pressed={filters.keywords.includes(s.key)}
                    onClick={() => toggleIn("keywords", s.key)}
                  >
                    {s.label}
                    <span className="count">{n}</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* ------------------------------------------------ journals */}
        <section className="panel">
          <div className="panel-head">
            <h2>Journals</h2>
            <button className="linkbtn" onClick={() => setShowJournals((v) => !v)}>
              {showJournals ? "Hide" : `Show all ${JOURNALS.length}`}
            </button>
          </div>
          {showJournals && (
            <>
              <p className="hint">
                No selection means all of them. Click to narrow to a few.
              </p>
              <div className="chiprow">
                {JOURNALS.map((j) => (
                  <button
                    key={j.id}
                    className="chip"
                    data-accent="light-blue"
                    data-on={filters.journals.includes(j.id)}
                    aria-pressed={filters.journals.includes(j.id)}
                    title={j.name}
                    onClick={() => toggleIn("journals", j.id)}
                  >
                    {j.name}
                    <span className="count">
                      {articles.filter((a) => a.journalId === j.id).length}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

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
                  activeDesigns={filters.designs}
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
