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

### Gamified Tokenomics (Stats → Token Economics) — 2026-02-04

#### Context
Use creature stats to influence actual token parameters via Clanker SDK v4.
Makes the creature generation meaningful - stats determine token structure.

#### Plan
- [ ] **Phase 1: Stats Mapping Design**
  - Define stat ranges and their token parameter mappings
  - Power (0-100) → Starting market cap multiplier
  - Defense (0-100) → Vesting lockup duration (0 = none, 100 = max 90 days)
  - Speed (0-100) → Vesting unlock speed (linear vs cliff)
  - Element type → Fee structure preset

- [ ] **Phase 2: Rarity System**
  - Define rarity tiers: Common (60%), Uncommon (25%), Rare (12%), Legendary (3%)
  - Rarity calculated from total stat roll
  - Common: Basic token, no vesting
  - Uncommon: Can enable vesting vault (optional)
  - Rare: Vesting vault + community reward split
  - Legendary: Max vesting + treasury allocation + special metadata

- [ ] **Phase 3: Deploy Integration**
  - Update `/api/deploy` to accept creature stats
  - Map stats to Clanker SDK parameters:
    - `vault.supplyPercentage` based on defense
    - `vault.lockupDuration` based on defense
    - `vault.vestingDuration` based on speed
    - `pool.startingMarketCap` based on power
    - `fees` based on element type
  - Add rarity to token metadata/description

- [ ] **Phase 4: Referral Rewards**
  - Use Clanker's `rewards` array for splits
  - Creator: 70-80%
  - Referrer (if exists): 15-20%
  - ClankDex treasury: 5-10%

- [ ] **Phase 5: Evolution Bonuses**
  - Merged creatures get stat bonuses
  - Higher rarity floor for evolved creatures
  - Better tokenomics (higher market cap, better vesting)

#### Verification
- [ ] Stats correctly map to token parameters
- [ ] Rarity distribution matches expected %
- [ ] Clanker deploy succeeds with all parameter combos
- [ ] Referral splits work correctly
- [ ] UI shows stats → tokenomics relationship clearly

#### Questions to Resolve
- What are sensible market cap ranges? (need to check Clanker defaults)
- Max vesting duration that makes sense? (7 days min per SDK)
- Should users see tokenomics BEFORE deploy or is surprise part of fun?

---

### Game Boy 3D tilt and polish — 2026-02-04

#### Plan
- [x] Add mouse position tracking with useRef
- [x] Calculate tilt angles (±12°) based on cursor position
- [x] Apply CSS 3D transforms with perspective
- [x] Add dynamic light reflection overlay that follows cursor
- [x] Enhance LCD with scanlines and stronger glow
- [x] Improve button hover/active states
- [x] Add translateZ depth to interactive elements
- [x] Enhance power LED glow

#### Verification
- [x] Tilt responds smoothly to mouse movement
- [x] Returns to neutral on mouse leave
- [x] Light reflection follows cursor
- [x] Buttons feel more interactive
- [x] No performance issues with transforms

#### Review
- **Summary**: Added premium 3D tilt effect that tracks mouse position, dynamic specular highlight, enhanced LCD scanlines/glow, improved button interactivity with hover states and depth.
- **Files changed**: `page.tsx` (mouse tracking state/handlers), `globals.css` (enhanced styling)
- **Follow-ups**: Could add mobile gyroscope support, subtle ambient floating animation

---

### Boot screen with logo animation — 2026-02-04

#### Plan
- [x] Copy logo image to public folder
- [x] Add `isBooting` state with 2.8s timer
- [x] Create boot screen with logo, glow effect, progress bar
- [x] Add `!isBooting` guard to all screen mode conditions
- [x] Smooth fade transition to main menu

#### Verification
- [x] Logo displays correctly on page load
- [x] Animation plays smoothly (glow pulse, progress bar fill)
- [x] Transitions to menu after boot completes
- [x] No flash of menu content during boot

#### Review
- **Summary**: Added Game Boy-style power-on sequence showing ClankDex logo with pulsing glow, "LOADING..." text, and progress bar. 2.8s duration before fade to main menu.
- **Files changed**: `page.tsx` (boot state + boot screen JSX), `public/clankdex-logo.png` (added)
- **Follow-ups**: Could add sound effect, skip on tap/click

---

### Background redesign — 2026-02-04

#### Plan
- [x] Remove PNG-based parallax layers (causing transparency/checkered pattern)
- [x] Attempt 1: Pure CSS tree silhouettes + animations (too cartoon)
- [x] Attempt 2: Zelda-style with fairies, orbs, leaves (too busy/childish)
- [x] Attempt 3: Clean modern dark aesthetic (approved)
- [x] Delete unused forest PNG files

#### Verification
- [x] No checkered transparency pattern visible
- [x] Background blends smoothly with page
- [x] Animations are subtle, not distracting
- [x] Professional/sleek appearance

#### Review
- **Summary**: Removed all PNG-based forest layers that had transparency issues. After two rejected iterations (cartoon trees, then Zelda-style busy animations), settled on clean Stripe/Linear-inspired dark gradient with soft bokeh orbs and minimal particles.
- **Files changed**: `globals.css` (background styles), `EnchantedForest.tsx` (simplified component), deleted `forest-bg.png`, `forest_layer_1.png`, `forest_layer_2.png`
- **Lessons**: User wanted sleek/professional, not playful. Should have asked for style references earlier.

---

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
