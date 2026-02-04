# 🎨 ClankDex Figma Integration Guide

## Quick Start

### 1. Install Figma Plugins

**For Design → Code:**
- [Visual Copilot](https://www.figma.com/community/plugin/857346721322613208) - Best for React/Tailwind
- [TeleportHQ](https://www.figma.com/community/plugin/992726161890204477) - Full project export
- [Figma Token Exporter](https://www.figma.com/community/plugin/1345069854741911632) - Design tokens

**For Icons/Assets:**
- [Iconify](https://www.figma.com/community/plugin/735098390272716381) - 100k+ icons
- [Unsplash](https://www.figma.com/community/plugin/738454987945972471) - Free images

---

## Design System Setup

### Step 1: Create Figma File
1. Go to [figma.com](https://figma.com) → New Design File
2. Import this design system:

```
File Name: "ClankDex Design System"
```

### Step 2: Set Up Color Styles

Create these color styles in Figma:

```
🎨 Colors/
├── Device/
│   ├── Shell/Light    #e8e4dc
│   ├── Shell/Default  #ddd8ce
│   ├── Shell/Dark     #b5b0a6
│   ├── Bezel/Light    #2a2a32
│   ├── Bezel/Default  #1e1e24
│   ├── Bezel/Dark     #121216
│   ├── LCD/Light      #9bbc0f
│   ├── LCD/Default    #8bac0f
│   ├── LCD/Dark       #6b8c0d
│   └── LCD/Text       #0f380f
│
├── UI/
│   ├── Primary        #DC0A2D (Pokédex Red)
│   ├── Secondary      #3B4CCA (Blue)
│   ├── Accent         #FFDE00 (Yellow)
│   ├── Success        #51AE5E
│   └── Danger         #8B1A3A
│
└── Elements/
    ├── Fire           #FF5722
    ├── Water          #2196F3
    ├── Grass          #4CAF50
    ├── Electric       #FFEB3B
    └── ... (see tokens.json)
```

### Step 3: Typography Styles

```
🔤 Typography/
├── Pixel/
│   ├── H1     Press Start 2P / 20px
│   ├── H2     Press Start 2P / 16px
│   ├── Body   Press Start 2P / 12px
│   └── Small  Press Start 2P / 10px
│
└── Body/
    ├── H1     DM Sans / 24px / Bold
    ├── H2     DM Sans / 20px / SemiBold
    ├── Body   DM Sans / 16px / Regular
    └── Small  DM Sans / 12px / Regular
```

### Step 4: Component Library

Create these components:

```
🧩 Components/
├── Device/
│   ├── GameBoy Shell
│   ├── LCD Screen
│   ├── D-Pad
│   ├── A/B Buttons
│   └── Start/Select
│
├── Cards/
│   ├── Creature Card
│   ├── Stat Bar
│   ├── Type Badge
│   └── Evolution Badge
│
├── Screens/
│   ├── Main Menu
│   ├── Scan Mode
│   ├── Creature View
│   └── Collection
│
└── Feedback/
    ├── Loading Spinner
    ├── Success Modal
    └── Error Toast
```

---

## Export to React

### Using Visual Copilot:

1. **Install Plugin** in Figma
2. **Select frames** you want to export
3. **Choose settings:**
   - Framework: React
   - Styling: Tailwind CSS
   - Component Type: Functional
4. **Copy code** → Paste into `frontend/app/components/`

### Using TeleportHQ:

1. **Install Plugin**
2. **Export entire project**
3. **Download as Next.js**
4. **Merge** with existing code

---

## Design Tokens Sync

### Export from Figma:

Use "Figma Token Exporter" plugin → Export as JSON

### Import to Project:

Replace `tokens.json` with exported file, then run:

```bash
cd frontend
node design-system/sync-tokens.js
```

This updates `tailwind.config.js` automatically.

---

## Recommended Design Improvements

### 1. **Glassmorphism Cards**
```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}
```

### 2. **Animated Backgrounds**
- Floating particles
- Gradient orbs
- Scanline overlay

### 3. **Micro-interactions**
- Button press animations
- Card hover effects
- Page transitions

### 4. **3D Elements**
- Tilt cards on hover
- 3D creature showcase
- Depth layers

---

## Figma Community Resources

### UI Kits:
- [Game UI Kit](https://www.figma.com/community/file/)
- [Crypto Dashboard](https://www.figma.com/community/file/)
- [Retro Gaming](https://www.figma.com/community/file/)

### Icon Sets:
- [Lucide Icons](https://www.figma.com/community/plugin/)
- [Crypto Icons](https://www.figma.com/community/file/)

---

## Workflow

```
1. Design in Figma
   ↓
2. Export tokens to JSON
   ↓
3. Sync to tailwind.config.js
   ↓
4. Export components with Visual Copilot
   ↓
5. Paste into frontend/app/components/
   ↓
6. Adjust integration points
   ↓
7. Commit & Push
```

---

## Need Help?

I can:
- ✅ Create a Figma template for you
- ✅ Build the component library structure
- ✅ Sync design tokens automatically
- ✅ Convert Figma exports to React components

Just share your Figma file URL or export!
