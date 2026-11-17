/**
 * "N new since your last visit."
 *
 * Comparing publication dates against a timestamp would be wrong: OpenAlex
 * indexes a lot of articles days or weeks after their publication date, so a
 * paper dated last Tuesday can appear in the feed for the first time today.
 * What you actually want to know is *what wasn't here last time you looked* —
 * so this stores the set of article IDs present at the end of your last visit
 * and diffs against it.
 *
 * The snapshot is written as soon as the diff has been taken, so refreshing
 * correctly reports nothing new. The count itself is held for the session, so
 * the banner doesn't vanish from under you while you're reading.
 */

const IDS_KEY = "research-feed.lastVisitIds.v1";
const AT_KEY = "research-feed.lastVisitAt.v1";

export type VisitInfo = {
  /** Articles that weren't in the feed at the end of the last visit. */
  newIds: string[];
  /** When that visit was, or null the first time anyone opens the app. */
  lastVisitAt: string | null;
  /** True before any diff has been taken, so the UI can stay quiet. */
  pending: boolean;
};

const INITIAL: VisitInfo = { newIds: [], lastVisitAt: null, pending: true };

let snapshot: VisitInfo = INITIAL;
let done = false;

type Listener = () => void;
const listeners = new Set<Listener>();

export const visitStore = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  getSnapshot: () => snapshot,
  getServerSnapshot: () => INITIAL,

  /**
   * Called once the feed's articles are known. Safe to call repeatedly — only
   * the first call with a non-empty feed does anything, so re-renders and
   * React's development double-invocation can't double-count or wipe the
   * banner.
   */
  prime(ids: string[]) {
    if (done || ids.length === 0) return;
    done = true;

    let previous: string[] = [];
    let lastVisitAt: string | null = null;
    try {
      const raw = localStorage.getItem(IDS_KEY);
      previous = raw ? (JSON.parse(raw) as string[]) : [];
      lastVisitAt = localStorage.getItem(AT_KEY);
    } catch {
      // Blocked or corrupted storage: treat it as a first visit, which shows
      // no banner rather than claiming everything is new.
      previous = [];
      lastVisitAt = null;
    }

    const known = new Set(previous);
    // A genuine first visit has no stored list; everything would look new, so
    // report nothing instead of "307 new articles".
    const newIds = previous.length === 0 ? [] : ids.filter((id) => !known.has(id));

    snapshot = { newIds, lastVisitAt, pending: false };

    try {
      localStorage.setItem(IDS_KEY, JSON.stringify(ids));
      localStorage.setItem(AT_KEY, new Date().toISOString());
    } catch {
      /* The count is still right for this session; it just won't persist. */
    }

    for (const fn of listeners) fn();
  },
};

export function formatVisitDate(iso: string): string {
  const then = new Date(iso);
  const days = Math.floor((Date.now() - then.getTime()) / 86_400_000);
  if (days <= 0) return "earlier today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
