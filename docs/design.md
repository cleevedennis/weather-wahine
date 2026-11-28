# Design

## Look and feel

A mobile-first, single-column layout (max 560px) of frosted-glass cards on a full-screen sky gradient, inspired by
modern weather apps but in a deep pounamu-green palette with Māori accent motifs.

## App icon

`icons/icon.svg`: **te rā, the sun** — a kōwhai sun with a soft glow, centred on the pounamu gradient. It sits inside
the maskable safe zone, so one full-bleed design serves all sizes and stays legible down to 32px.
Re-render the PNGs after editing it: `node tools/render_icons.js icons`.

The Home Screen label is **Weather Wahine** (`apple-mobile-web-app-title` and the manifest's `short_name`). iOS may
shorten names this long on the Home Screen (e.g. "Weather Wa…"); a shorter `short_name` avoids that if it matters.

## Colour tokens (`:root` in `index.html`)

| Token | Value | Use |
|---|---|---|
| `--sky-a` / `--sky-b` | `#0d3b2e` / `#2e7d5b` | Background gradient (overridden per weather, below) |
| `--glass` | `rgba(4, 24, 18, .32)` | Card and badge background (with backdrop blur) |
| `--bone` | `#f3ead8` | Selected day, wordmark, links, motif highlights |
| `--kokowai` | `#d9734a` | Red ochre: motifs, tide-window shading, primary button |
| `--tide` | `#6fd6cf` | Tide dots, chips and curve |
| `--sun` | `#f2c94c` | Kōwhai yellow: sunny dots and chips |
| `--both` | `#ef8d5f` | Medal badge in the top section |
| `--rain` / `--swell` | `#9cc8f0` / `#c3b6f2` | Rain and Swell column labels |
| `--platinum` `--gold` `--silver` `--bronze` | `#e4ebee` `#e8bd4f` `#aeb8bf` `#d9925e` | Medal tags |
| `--muted` | `rgba(255,255,255,.82)` | Secondary text (meets contrast) |

Sky gradients by the selected day's window weather (`body[data-sky]`):

| Sky | From → to |
|---|---|
| clear | `#0b3a2c` → `#2f7f5c` |
| partly | `#0f3830` → `#3d6e5e` |
| overcast | `#17282a` → `#46584f` |
| rain | `#0e1d1b` → `#324540` |
| storm | `#091210` → `#26332e` |

Warnings use a deep red badge (`rgba(160,30,20,.65)`) and `#ffb8a3` text.

## Day rows (the standard list item)

Every list of days uses one row layout (`dayRow()` in `index.html`), so the page reads as one system:

| Part | Detail |
|---|---|
| Day | "Thursday, 10 Dec" ("Today, 28 Nov"); below 380px wide, "Thu, 10 Dec" |
| Medal tag | Its own line under the day: a thin outlined pill in the medal colour, upper-case (PLATINUM, GOLD, SILVER, BRONZE). Only ranked days have one |
| Columns | Weather icon (line icon: sun, partly, cloud, fog, rain, snow, storm) · Tide (first high in window, "—" if none) · Temp (window) · Rain (window) · Swell |
| Column labels | Once per card, above the rows, coloured `--tide` / `--sun` / `--rain` / `--swell` |
| Warnings | Swell 2.5 m+ turns the value coral (`#ffb8a3`); no extra warning lines |
| Selected day | Day text underlined |

New lists of days should reuse this row rather than adding a new layout. In **Medal days** (All beaches) the
medal tag's line shows the top beach instead ("Piha +4 more"), because the medal is the group heading.

## Medals

Medals are score bands (out of 9), the same on every screen: **platinum 8–9, gold 6–7, silver 4–5, bronze 2–3**.
A day can share a medal with other days (two golds, no platinum).

## All beaches (default view)

| Part | Detail |
|---|---|
| Picker | "All beaches" first, with a gold line trophy beside it; the app always opens on it (the beach isn't remembered) |
| Top section | Champion day: the highest-scoring beach-day (ties → earlier date), its beaches ("Karekare & Piha +4 more platinum") and badges |
| Tournament card | Grid: beaches (grouped Manukau Harbour / West Coast) × days. Filled dot in the medal colour; hollow ring = high tide fits, no medal; faint speck = no high tide in window. Weekend dates in bone. Tap a dot → that beach on that day |
| ★ Medal days card | Replaces the 16-day list, grouped by medal, by date within a medal. A switch (pill toggle) picks **All** (default: one row per beach-day with a medal, beach named under the date) or **Best per day** (each day once under its best medal; stats are the top beach's, "+N more"). Days with no medal anywhere are left out |
| Hidden | Best days, Tide and 16-day forecast cards (they return when a beach is picked) |

## Māori motifs

All are inline SVG (no image files) and purely decorative (`aria-hidden`):

| Motif | Where | Notes |
|---|---|---|
| **Poutama** (stepped pattern) | Bands at the top of the page and above the footer, in kōkōwai | Stepped pattern widely used in tukutuku panels |
| **Niho taniwha** (triangles) | Under each card heading, alternating kōkōwai and bone | Common in tukutuku and tāniko borders |
| **Koru** (unfurling frond) | Faint watermark behind the temperature | Widely used in public NZ design |

Chosen as general, widely shared motifs. Sacred or personal forms (e.g. tā moko) are deliberately avoided.

## Te reo Māori headings

| Heading | Meaning | Note |
|---|---|---|
| Ngā rā pai · Best days / Medal days | the good days | |
| Te whakataetae · Tournament | the competition | All beaches grid |
| Te tai · Tide | the tide / sea | |
| Matapae huarere · 16-day forecast | weather forecast | |
| Tautuhinga · Settings | settings | |

**Status:** not yet reviewed by a te reo speaker — see [TODO](../TODO.md). On screens narrower than 380px only the te
reo part is shown.

## Accessibility

- No axe-core violations (checked in CI); text contrast raised for the green backgrounds.
- A visually hidden `<h1>` gives the page a heading; decorative motifs are hidden from screen readers.
- Every tappable day is keyboard-focusable with a visible focus ring; Enter/Space select it.
- Respects `prefers-reduced-motion`.
- Works from 320px wide to desktop with no sideways scrolling (checked in CI).

## Wording principles

- Say what a label actually means: medals rank the tide and weather; never "Beach day".
- Always show where tide times come from (LINZ or model).
- No swim-safety notices on the page: the users know these beaches and judge the surf on the day.

## Design canvas

The visual spec lives on a Design canvas: https://claude.ai/artifact/2gEM26bXS872U5tdesbnKo (artboard
`project/Main.dc.html`, the All beaches view at 390 px; private to the owner). Edits made there reach the app through
the `/canvas-ship` skill (`.claude/skills/canvas-ship/`), which translates each change into a small PR; the canvas's
sample data and markup are never copied into the app.

**Canvas baseline:** version `1795864245-6a8c` (synced to the live app 2026-11-28; the Medal days switch works in
Play). The canvas uses the same icons and wording as the app. Its scores and stats are sample data.

Known differences (the app is right; don't flag these in a diff): none.
