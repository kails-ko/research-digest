# Research Feed

A personal feed of everything published in the last 30 days across 23 child,
family, and clinical psychology journals. Data comes from
[OpenAlex](https://openalex.org). Styling comes from `../personal-brand-kit`.

```bash
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
```

---

## The filtering idea

The reference app this was modeled on (`stats-lab-research-feed`) asks you to
type keywords, then highlights where they appear. That has a known failure mode:
you only find what you thought to type, and you have to spell it the way the
author did. This app replaces typing with four click-based layers.

### 1. Topics — OpenAlex's own classification

OpenAlex classifies every work into a fixed taxonomy of ~4,500 **Topics**. An
article gets tagged `T10537` ("Attention Deficit Hyperactivity Disorder")
because OpenAlex classified it that way, **not** because the word "ADHD" appears
in it. So a paper titled *"Stimulant response in school-aged children"* shows up
under the ADHD chip even though it never says ADHD.

The chips in `lib/topics.ts` were not invented. They came from asking OpenAlex
which topics actually occur in these 23 journals over the last 12 months:

```bash
curl "https://api.openalex.org/works?filter=primary_location.source.id:S108595589|S60711021,from_publication_date:2025-11-16&group_by=topics.id&per-page=200"
```

Every chip is a topic real articles in your journals carry, grouped into five
rows: conditions, family & caregiving, identity & equity, treatment & services,
and development & school.

The panel is **collapsed by default** — the full chip set is five rows tall and
would otherwise push the feed below the fold on every visit. The header still
reports how many chips are selected while it's shut, and **Deselect all** clears
both the topic and study-design rows in one click.

### 2. "Showing up this month" — self-refreshing vocabulary

OpenAlex also attaches free-form **keywords** to most works (~97% of this
month's set). The app counts them across whatever came back and offers the most
common in a checkbox dropdown (tick several at once; "Deselect all" clears
them). This row changes every time the feed refreshes, so it surfaces
terms you wouldn't have thought to search for — it's the feed telling you what
is in it rather than you guessing.

### 3. Lenses — one click, several chips

A lens is a named standing search: "ADHD & families" applies three topic chips
at once, and "Parent training" applies four. These are the real replacement for retyping the same query every
week. Six ship in `LENSES` (`lib/topics.ts`); they are plain data, so add your
own.

### How the layers combine

Chips **within** a layer are OR'd; the layers are AND'd together.

- ADHD + Autism → *widens* (either one)
- ADHD + a keyword, or ADHD + a journal → *narrows* (both must hold)

---

## Editing the feed

Everything you'd want to change is data, in two files.

**Add or remove a journal** — `lib/journals.ts`. Journal names are written out
in full everywhere in the UI, never abbreviated, so there is only a `name` field
to fill in. Look the ID up rather than guessing it:

```bash
curl "https://api.openalex.org/sources?search=Journal+of+Abnormal+Child+Psychology&select=id,display_name,issn_l"
```

**Add a topic chip** — `lib/topics.ts`. Same idea:

```bash
curl "https://api.openalex.org/topics?search=school+refusal&select=id,display_name"
```

**Change the window** — `WINDOW_DAYS` in `lib/openalex.ts` (currently 30).

**Add a lens** — `LENSES` in `lib/topics.ts`.

**Note on the five topic category headings** (Conditions & presenting problems,
Family & caregiving, and so on): those are *hand-made in `lib/topics.ts`*, not
OpenAlex's. OpenAlex does have a real hierarchy — topic → subfield → field →
domain — but it is organized for bibliometrics, not clinical work: ADHD sits
under Medicine, autism under Neuroscience, family dynamics under Demography,
and psychometrics under Decision Sciences. Grouping by it would scatter this
feed across four domains, so the headings are editorial. The topic IDs and
names underneath them are OpenAlex's and unchanged.

---

## How it fetches

One request per hour, not one per click.

`app/page.tsx` fetches the whole 30-day window server-side inside a `"use cache"`
function with `cacheLife("hours")`, then hands the normalized article list to
the client as a single payload. Every chip click filters that payload in memory.
OpenAlex sees one call an hour regardless of how much you click.

Two things about the OpenAlex API are worth knowing, because both bit during
the build and both are easy to re-introduce:

- **Don't use `cursor=` paging.** OpenAlex now returns `401 API key required for
  cursor paging` on anything past the first page without a key. Basic `page=`
  paging stays open to anonymous callers up to 10,000 results, so that's what
  `lib/openalex.ts` uses.
- **Don't let Next cache the raw response.** It's ~3 MB with abstracts, over
  Next's 2 MB per-entry fetch-cache limit, which fails and logs an error on every
  load. The fetch is `cache: "no-store"` and caching happens one level up, on
  the normalized (much smaller) result.

### API key

None is set, and none is needed. Anonymous access is about 1,000 requests/day
shared across everyone on your IP; this app uses roughly one an hour. If you
ever want your own, get one at <https://openalex.org/settings/api> and set
`OPENALEX_API_KEY` in the environment — `lib/openalex.ts` already reads it and
nothing else changes.

---

## Branding

Translated from `../personal-brand-kit` into `app/globals.css`. Indigo `#273287`
anchors, Ground `#FCF9ED` is the page, Navy `#181A4D` is body text; Montserrat
Alternates for display, Karla for UI, Fraunces for abstracts, IBM Plex Mono for
dates, DOIs, and counts. Amber buttons with Navy text, 16px radius.

**This is a fourth copy of those nine hex values.** The brand kit's README
already tracks three (`brand-preamble.tex`, `handouts/R/theme_studio.R`,
`site/R/theme_studio.R`). If a value changes there, change it here too.

Two deliberate choices worth flagging:

- **Article titles are Indigo, not Red.** The kit scopes Red to "a link inline
  within a sentence," which a card title isn't. Red appears on hover.
- **No dark mode.** The brand kit lists dark mode as an open, undecided
  question. Inventing a dark palette here would quietly make that decision, so
  `color-scheme: light` says so explicitly instead.

The kit's colorblind and grayscale findings (Amber/Pistachio/Blush collapse
together) don't bite here: every chip carries its own text label, so color is
never the only thing distinguishing one from another.

---

## What's stored

What you've read and what you've saved live in `localStorage`, in this browser
only. They never reach a server, never reach OpenAlex, and don't sync between
devices. `lib/idStore.ts` exposes them through `useSyncExternalStore` so the
server render and the first client render agree.

---

## Deploying to Vercel

The build is fully static with hourly revalidation (`Route / — Revalidate 1h,
Expire 1d`), so it serves from the CDN.

```bash
npx vercel
```

Nothing to configure. If you add an API key later, add `OPENALEX_API_KEY` as a
Vercel environment variable — the fetch runs server-side, so it stays out of
the browser.

---

## Known gaps

- **`publication_date` is the publisher's date**, which for online-first articles
  can lead the print issue by months. A few articles may carry dates slightly
  ahead of today.
- **No "mark all read"** yet, and no way to jump back to the first unread item —
  both exist in the reference app.
- **No email or RSS digest.** The feed only exists when you open it.
