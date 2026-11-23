# Design

## Look and feel

A mobile-first, single-column layout (max 560px) of frosted-glass cards on a full-screen sky gradient, inspired by
modern weather apps but in a deep pounamu-green palette with Māori accent motifs.

## Colour tokens (`:root` in `index.html`)

| Token | Value | Use |
|---|---|---|
| `--sky-a` / `--sky-b` | `#0d3b2e` / `#2e7d5b` | Background gradient (overridden per weather, below) |
| `--glass` | `rgba(4, 24, 18, .32)` | Card and badge background (with backdrop blur) |
| `--bone` | `#f3ead8` | Selected day, wordmark, links, motif highlights |
| `--kokowai` | `#d9734a` | Red ochre: motifs, tide-window shading, primary button |
| `--tide` | `#6fd6cf` | Tide dots, chips and curve |
| `--sun` | `#f2c94c` | Kōwhai yellow: sunny dots and chips |
| `--both` | `#ef8d5f` | ★ Tide & sun outline and chips |
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
| Ngā rā pai · Best days | the good days | |
| Te tai · Tide | the tide / sea | |
| Maramataka · Calendar | calendar | Traditionally the Māori **lunar** calendar; often used for "calendar" generally — a speaker may prefer another word |
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

- Say what a label actually means: "★ Tide & sun", not "Beach day" — it is not a swim-safety rating.
- Always show where tide times come from (LINZ or model).
- Keep safety guidance visible: swim between the flags, check Safeswim.
