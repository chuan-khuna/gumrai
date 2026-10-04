---
name: implement-feature
description: Orchestrate the tickets of one feature in .scratch/<feature>/ by handing each ticket to its own subagent, in dependency order, one commit per ticket. Use when the user says "implement feature X", "/implement-feature <slug>", or asks the main agent to work through a feature's tickets.
argument-hint: <feature-slug>
disable-model-invocation: true
---

# Implement feature: $ARGUMENTS

You are the **orchestrator**. You do not write feature code yourself. You plan, delegate one ticket at a time to a subagent, verify its work, and report to the user.

Feature directory: `.scratch/$ARGUMENTS/`. Spec: `spec.md`. Tickets: `issues/NN-<slug>.md`.
If `$ARGUMENTS` is empty or the directory does not exist, list the directories under `.scratch/` and ask which one.

## 1. Plan (no code yet)

1. Read `spec.md`, `CONTEXT.md`, `docs/agents/issue-tracker.md`, and the header of every ticket. Each ticket has `**Blocked by:**` and `**Status:**` lines.
2. Skip tickets that are `done` or `wontfix`.
3. Build the order: a ticket is runnable when every ticket in its `Blocked by` is `done`. Ties go to the lower number.
4. Collect every ticket that cannot go to an agent as it stands: status `needs-triage`, `needs-info` or `ready-for-human`, unchecked acceptance criteria that are ambiguous, or a dependency on something outside this feature.
5. Show the user a short plan: the run order, and the tickets that need their input. Then resolve those with the user **one question at a time, in Thai**. Record each answer as a comment in the ticket (`## Comments`) and set `**Status:** ready-for-agent` once it is clear.
6. Make sure the tree is clean and you are on a feature branch (`feat/$ARGUMENTS`), not `main`. Ask before stashing or committing anything that was already uncommitted.

## 2. Run, one ticket at a time

Run tickets **sequentially**: they share one working tree and one local Supabase, so parallel runs would fight over migrations and data.

For each runnable ticket, launch a `general-purpose` subagent with the prompt below, filled in. Wait for it to finish before starting the next.

```
You are implementing one ticket in the Gumrai repo (D:\code\gumrai).

Ticket: .scratch/<feature>/issues/<NN-slug>.md
Spec: .scratch/<feature>/spec.md
Read first: CLAUDE.md, CONTEXT.md, docs/adr/, and the ticket. Earlier tickets in
this feature are already committed; read their code rather than re-deriving it.

Do:
- Set the ticket's Status to `in-progress` before writing code.
- Build exactly what the ticket's acceptance criteria ask for. Nothing from other tickets.
- Work test-first (the `tdd` skill). Server tests run against the real local Supabase.
- Follow CLAUDE.md strictly: bun only, a new migration for every schema change
  (never edit a committed one), `bun run db:types` after schema changes, `@/` imports,
  OKLCH tokens only in globals.css, Thai UI text, numeric for money.
- Before finishing: `bun run check` and `bun run test` must both pass.
- Tick each acceptance criterion you met, set Status to `done`, and append a dated
  note under `## Comments` (what you built, any deviation and why).
- Make one commit: conventional message `feat(<area>): <ticket title> (#NN)`,
  staging only files you changed, ending with:
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>

Do not:
- Guess at an ambiguous requirement, lower the bunfig release-age floor, add
  minimumReleaseAgeExcludes, run `bun pm trust`, push, or touch other tickets.
  If any of these come up, stop without committing.

Reply with exactly one of:
DONE <commit sha> - one-line summary - any follow-ups
BLOCKED - the single question you need answered, and what you tried
FAILED - what fails (command + key output) and your best diagnosis
```

## 3. Verify each ticket before moving on

After every subagent:

- **DONE**: check it yourself. `git log -1 --stat` shows one commit with the expected files, the ticket says `done`, and `bun run check` and `bun run test` pass. If anything is off, send the subagent back with what you found (SendMessage), at most twice, then treat it as FAILED.
- **BLOCKED**: ask the user the question (in Thai, one at a time), write the answer into the ticket, then resume the same subagent with the answer.
- **FAILED**: stop the run. Do not start tickets that depend on it. Tickets that do not depend on it may continue only if the user says so.

Give the user a one-line update after each ticket: `✅ 03 cost-categories (abc1234)` or `⛔ 05 linked-lines: <reason>`.

## 4. Finish

When no runnable tickets remain, report: tickets done (with commit SHAs), tickets blocked or failed and why, and anything a subagent flagged as a follow-up. Do not push or open a PR unless the user asks.
