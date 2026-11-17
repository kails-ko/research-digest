import { EMPTY_FILTERS, type FilterState } from "./filter";

/**
 * The filters live in the URL rather than in component state.
 *
 * That one decision buys three things at once: a link you paste to a colleague
 * opens with your exact filters applied, the browser's back button undoes a
 * filter change, and a lens someone builds is shareable without any server to
 * share it through.
 *
 * It is exposed as an external store so `useSyncExternalStore` can read it.
 * The server has no URL to read, so `getServerSnapshot` returns an empty
 * query string and the first client render corrects it — which is exactly the
 * case that hook exists to handle.
 */

type Listener = () => void;
const listeners = new Set<Listener>();

function notify() {
  for (const fn of listeners) fn();
}

export const urlStore = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    // Back/forward move between filter states, so they have to notify too.
    window.addEventListener("popstate", notify);
    return () => {
      listeners.delete(fn);
      if (listeners.size === 0) window.removeEventListener("popstate", notify);
    };
  },
  /**
   * Returns a plain string. React compares snapshots with Object.is, and equal
   * strings are identical under it, so returning a fresh string each call is
   * safe here in a way that returning a fresh object would not be.
   */
  getSnapshot(): string {
    return window.location.search;
  },
  getServerSnapshot(): string {
    return "";
  },
  set(search: string) {
    // replaceState, not pushState: clicking six chips in a row shouldn't mean
    // six presses of Back to undo them.
    const url = search ? `${window.location.pathname}?${search}` : window.location.pathname;
    window.history.replaceState(null, "", url);
    notify();
  },
};

/* ------------------------------------------------------- serialization */

/** Short parameter names, because these URLs get pasted into messages. */
const KEYS = {
  topics: "t",
  keywords: "k",
  journals: "j",
} as const;

export function serializeFilters(f: FilterState): string {
  const p = new URLSearchParams();
  if (f.topics.length) p.set(KEYS.topics, f.topics.join(","));
  if (f.keywords.length) p.set(KEYS.keywords, f.keywords.join(","));
  if (f.journals.length) p.set(KEYS.journals, f.journals.join(","));
  if (f.access === "oa") p.set("oa", "1");
  if (f.status !== "all") p.set("show", f.status);
  if (f.sort !== "date") p.set("sort", f.sort);
  return p.toString();
}

export function parseFilters(search: string): FilterState {
  const p = new URLSearchParams(search);
  const list = (key: string) => {
    const raw = p.get(key);
    return raw ? raw.split(",").filter(Boolean) : [];
  };
  const status = p.get("show");
  const sort = p.get("sort");
  return {
    ...EMPTY_FILTERS,
    topics: list(KEYS.topics),
    keywords: list(KEYS.keywords),
    journals: list(KEYS.journals),
    access: p.get("oa") === "1" ? "oa" : "any",
    status: status === "unseen" || status === "saved" ? status : "all",
    sort: sort === "unread" ? "unread" : "date",
  };
}
