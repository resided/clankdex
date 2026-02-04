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

## Parked (Come Back Later)

### Treasury & Wallet Setup — PARKED
- [ ] Create treasury wallet (Rabby/Rainbow)
- [ ] Save seed phrase securely
- [ ] Add `CLANKDEX_TREASURY_ADDRESS` to Vercel env vars
- [ ] Consider Safe multisig when treasury > $10k
- [ ] Define profit split (suggested: 60% profit, 40% reserve)
- [ ] Set up monthly treasury review cadence

**Note:** Code is ready, just needs the address. Revenue (5% interface fee) is implemented but going to zero address until this is done.

---

## Current / Recent

### ClankDex Revenue Setup — 2026-02-04

#### Plan
- [x] Add `rewardsConfig` to Clanker deploy
- [x] Set 95% creator / 5% ClankDex split
- [x] Add `CLANKDEX_TREASURY_ADDRESS` env var
- [x] Add warning if treasury not configured
- [x] Return reward split in API response

#### Verification
- [x] Code compiles without errors
- [ ] Test deploy with treasury address set
- [ ] Verify rewards config in deployed token

#### Review
- **Summary**: Added `rewardsConfig` to all token deployments. Creator gets 95% of LP fees, ClankDex treasury gets 5%. Passive revenue on every token forever.
- **Action required**: Set `CLANKDEX_TREASURY_ADDRESS` in Vercel env vars!

---

### Creature Simplification — 2026-02-04

#### Context
User decided to simplify the creature system. Stats and elements added complexity without meaningful benefit. The core differentiator is: AI-generated creature image + unique name based on wallet/Farcaster identity.

#### Plan
- [x] Remove stats (hp, attack, defense, speed, special) from creature generation
- [x] Remove elements (Fire, Water, etc.) from creature generation
- [x] Keep archetype system (Oracle, Influencer, Builder, etc.) for identity-based theming
- [x] Update preview API to generate simpler creatures
- [x] Update page.tsx Creature type and UI components
- [x] Update save-creature API to not require stats/elements
- [x] Update filtering to use archetype instead of element
- [x] Update RolodexCard to display archetype instead of stats

#### Verification
- [x] TypeScript compiles without errors
- [ ] App runs and creatures can be generated
- [ ] Collection displays correctly with archetype info

#### Review
- **Summary**: Removed stats (HP/ATK/DEF/SPD/SPC) and Pokemon-style elements from creature generation. Creatures now only have: name, description, archetype, colorPalette, DNA hash. Archetypes (Oracle, Influencer, Builder, Degen, etc.) are kept for identity-based theming and filtering.
- **Files changed**:
  - `api/preview/route.ts` - Simplified creature generation
  - `api/save-creature/route.ts` - Removed stats/element fields
  - `lib/supabase.ts` - Updated CreatureRecord type
  - `page.tsx` - Updated Creature interface, UI components, filtering
- **Database note**: Old creatures with element/stats will still display (backwards compat), new creatures will have archetype only

---

### ~~Gamified Tokenomics (Stats → Token Economics)~~ — CANCELLED

**Reason**: Cancelled as part of creature simplification. Stats and elements have been removed from the system.

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
