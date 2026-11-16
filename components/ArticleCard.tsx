"use client";

import { useState } from "react";
import type { Decorated } from "@/lib/filter";
import { formatDate } from "@/lib/filter";
import { DESIGN_TAGS, TOPIC_BY_ID } from "@/lib/topics";

const DESIGN_LABEL = new Map(DESIGN_TAGS.map((d) => [d.id, d.label]));

/**
 * APA 7 reference. Enough for pasting into a draft — author list, year,
 * title, journal, DOI. It does not have volume/issue/pages because OpenAlex's
 * biblio fields are unreliable for online-first articles, which is most of
 * what a last-30-days feed contains; the DOI is the stable locator.
 */
function apaCitation(a: Decorated): string {
  const names = a.authors.map((full) => {
    const parts = full.trim().split(/\s+/);
    const last = parts.pop() ?? full;
    const initials = parts.map((p) => `${p[0]}.`).join(" ");
    return initials ? `${last}, ${initials}` : last;
  });

  let authorStr: string;
  if (names.length === 0) authorStr = "";
  else if (names.length === 1) authorStr = names[0];
  else authorStr = `${names.slice(0, -1).join(", ")}, & ${names[names.length - 1]}`;
  if (a.authorCount > a.authors.length) authorStr += ", et al.";

  const year = a.date.slice(0, 4);
  const doi = a.doi ? ` https://doi.org/${a.doi}` : "";
  return `${authorStr} (${year}). ${a.title}. ${a.journalName}.${doi}`;
}

type Props = {
  article: Decorated;
  seen: boolean;
  saved: boolean;
  activeTopics: string[];
  activeDesigns: string[];
  activeKeywords: string[];
  onToggleSeen: (id: string) => void;
  onToggleSaved: (id: string) => void;
};

export default function ArticleCard({
  article: a,
  seen,
  saved,
  activeTopics,
  activeDesigns,
  activeKeywords,
  onToggleSeen,
  onToggleSaved,
}: Props) {
  const [openAbstract, setOpenAbstract] = useState(false);
  const [copied, setCopied] = useState(false);

  const href = a.doi ? `https://doi.org/${a.doi}` : a.landingUrl ?? undefined;

  async function copyCitation() {
    try {
      await navigator.clipboard.writeText(apaCitation(a));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  // Only the topics that this feed actually offers as chips are worth showing;
  // OpenAlex hangs several very generic topics on everything.
  const shownTopics = a.topicIds.filter((t) => TOPIC_BY_ID.has(t));

  return (
    <article className="card" data-seen={seen} data-saved={saved}>
      <div className="card-top">
        <span className="journal">{a.journalName}</span>
        <span className="pubdate mono">{formatDate(a.date)}</span>
        {a.isOA && <span className="badge badge-oa">Open access</span>}
        {a.type === "review" && <span className="badge badge-type">Review</span>}
        {saved && <span className="badge">Saved</span>}
      </div>

      <h3>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer noopener">
            {a.title}
          </a>
        ) : (
          a.title
        )}
      </h3>

      <p className="authors">
        {a.authors.join(", ")}
        {a.authorCount > a.authors.length && ` + ${a.authorCount - a.authors.length} more`}
      </p>

      {(shownTopics.length > 0 || a.designIds.length > 0) && (
        <div className="card-tags">
          {shownTopics.map((t) => (
            <span key={t} className="tag" data-match={activeTopics.includes(t)}>
              {TOPIC_BY_ID.get(t)?.label}
            </span>
          ))}
          {a.designIds.map((d) => (
            <span
              key={d}
              className="tag tag-design"
              data-match={activeDesigns.includes(d)}
            >
              {DESIGN_LABEL.get(d)}
            </span>
          ))}
        </div>
      )}

      {openAbstract &&
        (a.abstract ? (
          <p className="abstract">{a.abstract}</p>
        ) : (
          <p className="abstract">
            <em>
              No abstract in OpenAlex for this one — many publishers withhold them.
              The DOI link below goes to the publisher&rsquo;s page.
            </em>
          </p>
        ))}

      {a.keywords.length > 0 && openAbstract && (
        <div className="card-tags">
          {a.keywords.slice(0, 10).map((k) => (
            <span
              key={k}
              className="tag"
              data-match={activeKeywords.includes(k.toLowerCase())}
            >
              {k}
            </span>
          ))}
        </div>
      )}

      <div className="card-actions">
        <button className="linkbtn" onClick={() => setOpenAbstract((v) => !v)}>
          {openAbstract ? "Hide abstract" : "Show abstract"}
        </button>
        <button className="linkbtn" onClick={() => onToggleSeen(a.id)}>
          {seen ? "Mark unread" : "Mark as read"}
        </button>
        <button className="linkbtn" onClick={() => onToggleSaved(a.id)}>
          {saved ? "Remove from saved" : "Save"}
        </button>
        <button className="linkbtn" onClick={copyCitation}>
          {copied ? "Citation copied" : "Copy APA citation"}
        </button>
        {a.doi && <span className="doi mono">{a.doi}</span>}
      </div>
    </article>
  );
}
