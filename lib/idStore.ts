/**
 * A tiny localStorage-backed set of article IDs, exposed the way React wants
 * external state exposed.
 *
 * The naive version of this — useState plus a useEffect that reads storage on
 * mount — has two problems: it renders once with the wrong (empty) value and
 * then again with the right one, and the server render and the first client
 * render disagree. `useSyncExternalStore` exists for exactly this shape, with
 * `getServerSnapshot` making the server's answer explicit rather than accidental.
 */

type Listener = () => void;

export type IdStore = {
  subscribe: (fn: Listener) => () => void;
  getSnapshot: () => ReadonlySet<string>;
  getServerSnapshot: () => ReadonlySet<string>;
  toggle: (id: string) => void;
  clear: () => void;
};

const EMPTY: ReadonlySet<string> = new Set();

export function createIdStore(key: string): IdStore {
  const listeners = new Set<Listener>();
  // `undefined` means "not read yet". Storage is only touched on first read,
  // which happens on the client, never during the server render.
  let snapshot: ReadonlySet<string> | undefined;

  function read(): ReadonlySet<string> {
    if (snapshot) return snapshot;
    try {
      const raw = localStorage.getItem(key);
      snapshot = new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      // Private window, blocked storage, or corrupted JSON. The feed still
      // works; it just starts with nothing marked.
      snapshot = new Set();
    }
    return snapshot;
  }

  function write(next: ReadonlySet<string>) {
    snapshot = next;
    try {
      localStorage.setItem(key, JSON.stringify([...next]));
    } catch {
      // Storage full or blocked. Keep the in-memory value so the current
      // session still behaves; it just won't survive a reload.
    }
    for (const fn of listeners) fn();
  }

  return {
    subscribe(fn) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
    getSnapshot: read,
    getServerSnapshot: () => EMPTY,
    toggle(id) {
      const next = new Set(read());
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      write(next);
    },
    clear() {
      write(new Set());
    },
  };
}

export const seenStore = createIdStore("research-feed.seen.v1");
export const savedStore = createIdStore("research-feed.saved.v1");
