---
name: decision-modal
description: Put every decision, approval or write Claude needs from the user to them as a modal with three parts (the decision, a summary of the detail, accept/decline), batched up to 4 per modal with the recommended option first. Use whenever you are about to ask the user to choose, approve, confirm, or OK a write, publish, push, PR, deploy, cost or scope change.
---

# Decision modal

Every decision, approval or write you need from the user comes as a modal, never as a question buried in prose.

## Shape of each question
1. **DECISION:** one line naming what is being decided.
2. **SUMMARY:** the detail that matters: what will happen, what it changes or costs, whether it can be undone, and
   the do-it-yourself option where there is one.
3. **Accept / Decline:** the options. Put the option you recommend first and mark it "(Recommended)". If there are
   real alternatives, offer up to 4 options, but keep one meaning "accept" and one meaning "decline".

Write each question so it stands alone: the user may see only the modal, not your earlier text.

## How to ask
- Use the `AskUserQuestion` tool when you have it: up to 4 questions per call, each with a short `header` chip.
  Batch every pending decision into one call instead of asking one at a time.
- Without that tool, write the same three parts as a numbered list in chat and stop until the user answers.

## What not to ask
- Small, reversible choices with an obvious default (a file name, wording of a commit message, a test fixture):
  decide them and list them under **"Decided for you"** in your reply, so the user can still overrule.
- Anything the user already decided in this conversation, or that a project rule settles.
- System permission prompts (tool approvals, publish approvals) are drawn by the app and can't be reshaped. When one
  is coming, say in one line beforehand what it is for.

## After the answer
Act on it straight away. A decline means: don't do it, and don't ask the same thing again unless the user raises it.
