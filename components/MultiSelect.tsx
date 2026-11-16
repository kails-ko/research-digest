"use client";

import { useEffect, useId, useRef, useState } from "react";

export type Option = {
  /** The value stored in the filter state. */
  value: string;
  label: string;
  /** How many articles this option would bring in. */
  count: number;
};

type Props = {
  /** Button text when nothing is picked, e.g. "All journals". */
  placeholder: string;
  /** What one selection is called, for the button's summary: "3 journals". */
  noun: string;
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
};

/**
 * A checkbox dropdown: the list stays shut until you open it, several options
 * can be ticked at once, and the button says how many are on without being
 * opened. Replaces a long wall of chips for the two lists that are long enough
 * to be a wall — this month's keywords and the 23 journals.
 */
export default function MultiSelect({
  placeholder,
  noun,
  options,
  selected,
  onToggle,
  onClear,
}: Props) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  // Close on a click outside or on Escape. Both are subscriptions to the
  // document, which is what an effect is actually for.
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const n = selected.length;
  const summary = n === 0 ? placeholder : `${n} ${noun}${n === 1 ? "" : "s"} selected`;

  return (
    <div className="ms" ref={wrapRef}>
      <button
        type="button"
        className="ms-trigger"
        data-on={n > 0}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{summary}</span>
        <span className="ms-caret" aria-hidden="true">
          {open ? "▴" : "▾"}
        </span>
      </button>

      {n > 0 && (
        <button type="button" className="linkbtn" onClick={onClear}>
          Deselect all
        </button>
      )}

      {open && (
        <div className="ms-pop" id={listId} role="group" aria-label={placeholder}>
          <div className="ms-pop-head">
            <span className="ms-pop-count mono">
              {n} of {options.length}
            </span>
            <button
              type="button"
              className="linkbtn"
              onClick={onClear}
              disabled={n === 0}
            >
              Deselect all
            </button>
          </div>

          <div className="ms-list">
            {options.map((o) => {
              const on = selected.includes(o.value);
              return (
                <label key={o.value} className="ms-row" data-on={on} data-empty={o.count === 0}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => onToggle(o.value)}
                  />
                  <span className="ms-label">{o.label}</span>
                  <span className="count mono">{o.count}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
