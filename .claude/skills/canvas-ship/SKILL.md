---
name: canvas-ship
description: Turn edits the user made on the Weather Wahine Design canvas into small, clean PRs for the live app. Diffs the canvas against the last shipped version, sorts each change into a lane, translates it into the smallest change to index.html, and ships it through the /tweak pipeline with screenshot proof. Use when the user says they changed the canvas, comments "ship this" on it, or types /canvas-ship.
---

# Canvas → PR

The canvas is the **visual spec**, not source code: https://claude.ai/artifact/2gEM26bXS872U5tdesbnKo
(artboard `project/Main.dc.html`, the All beaches home view at 390 px). Its artboard is a self-contained mockup with
**made-up sample scores**. Never copy its markup, script or sample data into the app; translate each change into the
smallest edit to `index.html`.

Every question for the user follows the `decision-modal` skill. Shipping itself follows `/tweak` (steps 2–7: test,
CHANGELOG, PR into `main`, Auto-merge, deploy, one check). This skill only adds the steps before and around it.

## 1. Find what changed
- `Artifact` read, `url` above, `path: "project/Main.dc.html"`. Compare it with the version recorded in the
  **Canvas baseline** line of `docs/design.md` (read that version with `ver`, or diff the saved copies). If no
  baseline is recorded yet, compare against the live app instead (step 3) and record one when you ship.
- Comments on the canvas (`ArtifactComments`) are change requests too; anchor each change to the comment.
- Ignore designer-only text on the artboard (notes about the mockup itself, sample numbers).

## 2. Sort each change into a lane
| Lane | Examples | PR needs |
|---|---|---|
| **Token / copy** | colour, wording, spacing, icon, order of chips | CSS token or text change; screenshot. Usually < 30 lines. |
| **Layout** | a card moves, a column added, a new element | + update any asserting test in `tests/ui.spec.js`; `docs/user-guide.md` if users notice |
| **Logic** | score bands, thresholds, what counts as a medal | + `tests/logic.spec.js`, `docs/design.md` / `docs/user-guide.md`, `docs/decisions.md` entry |

One concern per PR. Several token/copy changes may share one PR; a logic change always gets its own.
Put the list of changes, each with its lane, to the user as one decision modal before writing code.

## 3. Build and prove it
- Branch from `origin/main` (`git fetch origin && git checkout -B <branch> origin/main`), edit, `npm ci && npm test`.
- Screenshot the app at phone size with the gate's mocked data:
  `OUT=test-results/canvas-shot.png npx playwright test -c tools/canvas/pw.config.js`
  (`BEACH=Piha` for one beach; in a cloud session add `PW_CHROMIUM=/opt/pw-browsers/chromium`). Look at it next to
  the artboard. Mention in the PR body what was compared; don't commit screenshots.

## 4. Ship and record
- `/tweak` steps 5–7. PR title: `Canvas: <what changed>`; body lists each change, its lane and the canvas version.
- Update the **Canvas baseline** line in `docs/design.md` to the canvas version you shipped from, in the same PR.
- If the canvas still shows something the app deliberately does differently, list it in that section under
  "Known differences" so the next diff doesn't flag it again.

## Keep it cheap
Read only the artboard file and the slice of `index.html` you change. One screenshot. One wait-and-check after merge.
