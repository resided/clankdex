# Lessons Learned

Update this file after any user correction. Write rules that prevent the same mistake.

---

## Format

For each lesson:

- **What happened**: Brief description of the mistake or correction.
- **Rule**: One sentence rule for future sessions.
- **Date**: When it was added.

---

## Lesson: Ask for style direction on visual work
- **What happened**: Built two iterations of animated forest background (cartoon trees, then Zelda-style with fairies/orbs) before user said it looked "childish and amateur". Had to rebuild with clean modern aesthetic.
- **Rule**: For visual/design work, ask for style references or mood (playful vs professional, minimal vs rich) BEFORE building.
- **Date**: 2026-02-04

---

## Lesson: Surface assumptions on feature requests
- **What happened**: Built boot screen without stating assumptions about duration, animation style, colors. Got lucky it was accepted, but should have confirmed.
- **Rule**: State assumptions explicitly (e.g., "ASSUMPTIONS: 3s duration, dark green theme, progress bar style - correct me now") before implementing non-trivial features.
- **Date**: 2026-02-04

---

## Lesson: 3D CSS transforms can break click interactions
- **What happened**: Added mouse-tracking 3D tilt effect to Game Boy device. Looked cool but made menu clicking janky/unreliable.
- **Rule**: Test interactive elements thoroughly after adding CSS 3D transforms. The visual effect isn't worth broken UX.
- **Date**: 2026-02-04

---

## Lesson: PNG transparency causes checkered pattern
- **What happened**: Forest PNG layers had transparent areas that showed as checkered pattern. Tried multiple CSS workarounds before realizing the PNGs themselves were the problem.
- **Rule**: When seeing checkered transparency patterns, the issue is likely PNG images with alpha channels - fix by using solid backgrounds or pure CSS instead.
- **Date**: 2026-02-04
