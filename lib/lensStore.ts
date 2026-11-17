import type { FilterState } from "./filter";

/**
 * Lenses people make themselves.
 *
 * The six lenses in `lib/topics.ts` are defaults that ship with the app and
 * are the same for everyone. These are yours: made in the UI, stored in this
 * browser, never sent anywhere. Each person who opens the app builds their own
 * set without anyone needing an account.
 *
 * The honest limit of that choice: a custom lens lives in one browser on one
 * machine. It does not follow you to your phone, and clearing site data
 * removes it. The escape hatch is the share link — a lens is just a URL, so
 * pasting that link into a note, or to a colleague, recovers it anywhere.
 */

export type CustomLens = {
  id: string;
  label: string;
  /** The filters the lens restores. Stored as a URL query string. */
  search: string;
  createdAt: string;
};

const KEY = "research-feed.lenses.v1";

type Listener = () => void;
const listeners = new Set<Listener>();

let cache: CustomLens[] | undefined;

function read(): CustomLens[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as CustomLens[]) : [];
    cache = Array.isArray(parsed) ? parsed : [];
  } catch {
    // Blocked storage or corrupted JSON — start empty rather than break.
    cache = [];
  }
  return cache;
}

function write(next: CustomLens[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Keep it in memory for this session even if it can't be persisted.
  }
  for (const fn of listeners) fn();
}

const EMPTY: CustomLens[] = [];

export const lensStore = {
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  getSnapshot: read,
  getServerSnapshot: () => EMPTY,

  add(label: string, search: string) {
    const trimmed = label.trim();
    if (!trimmed) return;
    const next = [
      ...read().filter((l) => l.label.toLowerCase() !== trimmed.toLowerCase()),
      {
        id: `custom-${Date.now().toString(36)}`,
        label: trimmed,
        search,
        createdAt: new Date().toISOString(),
      },
    ];
    write(next);
  },

  remove(id: string) {
    write(read().filter((l) => l.id !== id));
  },
};

/**
 * A one-line summary of what a saved lens actually filters on, so the card
 * says something useful without the person having to click it.
 */
export function describeSearch(f: FilterState): string {
  const bits: string[] = [];
  if (f.topics.length) bits.push(`${f.topics.length} topic${f.topics.length === 1 ? "" : "s"}`);
  if (f.keywords.length)
    bits.push(`${f.keywords.length} keyword${f.keywords.length === 1 ? "" : "s"}`);
  if (f.journals.length)
    bits.push(`${f.journals.length} journal${f.journals.length === 1 ? "" : "s"}`);
  if (f.access === "oa") bits.push("open access only");
  return bits.length ? bits.join(" · ") : "No filters";
}
