# Task Plan & Progress

Use this file for non-trivial tasks (3+ steps or architectural decisions).

## Template

```markdown
## [Task name] — YYYY-MM-DD

### Plan
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

### Verification
- [ ] Run tests
- [ ] Manual check / diff

### Review (fill after completion)
- Summary of changes
- Any follow-ups
```

---

## Current / Recent

### UX audit & end-user improvements — 2025-02-03

#### Plan
- [x] Audit: error feedback (alert → in-app), validation hints, launch/merge response checks, viewport a11y, empty states
- [ ] Replace all `alert()` with dismissible in-app banner (error/success)
- [ ] Add inline validation for scan: show hint when wallet not connected or Farcaster username empty
- [ ] Fix launch flow: check `generateResponse.ok` and handle missing `imageUrl` before deploy
- [ ] Fix merge flow: same for generate-image response
- [ ] Allow zoom in viewport (remove userScalable: false) for accessibility
- [ ] Add empty state in Rolodex when no creatures

#### Verification
- [x] No `alert()` left for user-facing messages (all use in-app feedback banner or local feedback)
- [x] Farcaster: empty username shows in-app error "Enter a Farcaster username (e.g. @username)"
- [x] Launch/merge check `generateResponse.ok` and missing `imageUrl`; errors show in-app
- [x] Viewport allows pinch-zoom (`userScalable: true`, `maximumScale: 5`)
- [x] Collection empty state already present (Rolodex + Game Boy screen)

#### Review
- **Summary**: In-app feedback banner at top of main (dismissible), replace all alerts with `setFeedback` or local feedback in ClaimRewardsButton. Launch and merge now validate generate-image response and show clear errors. Viewport allows zoom for a11y. Farcaster empty input shows friendly error.
- **Follow-ups**: Consider adding a loading skeleton for collection on first load; optional rate-limit messaging if APIs throttle.

---
