# Claudex – Claude Session Rules

Claude reads this automatically every session. Follow these rules for every task.

---

## 1. Plan Mode Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

## 2. Subagent Strategy (Keep Main Context Clean)

- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

## 3. Self-Improvement Loop

- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

## 4. Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

## 5. Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

## 6. Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests → then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

---

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

---

## Security Gate (Before Completing Any Task)

Before completing any task, run these checks:

- [ ] Scan for hardcoded secrets, API keys, passwords
- [ ] Check for SQL injection, shell injection, path traversal
- [ ] Verify all user inputs are validated
- [ ] Run the test suite
- [ ] Check for type errors

This is a built-in security gate. Do not skip it.

---

## Prompts That Catch Bugs

Use these (or equivalent) when reviewing or testing code:

- **"Write 20 unit tests designed to break this function"** — surfaces where corners were cut.
- **"Find every security vulnerability in this file. Think like a pentester."** — SQL injection, auth bypasses, privilege escalation, input validation gaps.
- **"Generate 50 edge cases: null, empty strings, negative numbers, unicode, arrays with 100k items"** — for fuzzing and hypothesis-style testing.
- **"Audit this entire codebase for leaked secrets"** — API keys in comments, passwords in config files, tokens in error messages.

---

## Tools That Plug Into Claude

- **claude-code-action** (e.g. GitHub) — add to repo; Claude reviews every PR automatically.
- **claude-agent-sdk** — batch test directories; pipe files through Claude's security audit.
- **Factory.ai droids** — run `droid` in terminal; scans repo, opens PRs with fixes; connects to GitHub, Jira, Sentry.

---

## Automated Scanners (Stack These)

- **semgrep scan** — SAST, OWASP Top 10
- **bandit -r .** — Python security (when applicable)
- **ruff check . --fix** — linting + auto-fix (Python)
- **mypy . --strict** — type errors (or project equivalent: `tsc --noEmit`, etc.)
- **snyk test** — dependency CVEs
- **gitleaks detect** — leaked secrets

Run these when relevant to the stack (Node/TS: use ESLint, tsc, etc. instead of bandit/ruff/mypy where appropriate).

---

## Pre-commit Hooks

- Use **pre-commit** (e.g. `pip install pre-commit` or project equivalent).
- Add the scanners above to `.pre-commit-config.yaml` so vulnerable or low-quality code is blocked from being committed.

---

## The Loop

1. Claude writes code  
2. **CLAUDE.md** forces self-review (plan + security gate)  
3. Automated scanners catch the rest  
4. Pre-commit blocks bad commits  
5. PR review (e.g. GitHub Action) catches what’s left  

Use this loop on every non-trivial change.
