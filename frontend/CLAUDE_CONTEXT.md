# ClankDex - Project Context for Next Claude Session

## Current State (Last Updated: 2026-01-28)

### What is ClankDex?
Wallet Pokedex powered by Clanker. Users scan their wallet or Farcaster profile, we analyze their on-chain/social data to generate a unique Pokemon-style creature with stats, then they can launch it as a Clanker token that evolves based on market cap.

### Technical Stack
- Next.js 14 + React + TypeScript + Tailwind
- Framer Motion for animations
- OpenAI DALL-E 3 for creature art
- Neynar API for wallet/Farcaster analysis
- Clanker for token deployment
- Supabase for evolution tracking
- Deployed on Vercel

### Current Features
1. **Wallet/Farcaster Scan** - Analyzes address/username
2. **Archetype System** - 10 types: Oracle, Influencer, Connector, Lurker, Builder, Degen, Whale, Sage, Nomad, Guardian
3. **Creature Generation** - Deterministic stats from SHA-256 hash + archetype bias
4. **AI Art** - DALL-E 3 generates Pokemon-style creatures (Ken Sugimori style)
5. **Token Launch** - Deploys to Clanker with unique symbol
6. **Evolution Tracking** - 7 tiers based on market cap (Egg → Legendary)
7. **Rolodex** - Collection view of all launched creatures

### Recent Changes (Last Session)
- Improved DALL-E prompts with detailed element visual guides
- Added negative constraints to avoid bad art
- Creature images now bigger on scan screen (4:3 aspect, 320px max)
- Descriptions explain WHY stats exist (linked to archetype)
- Epic launch animations (energy swirl → rocket → confetti)
- OG image matches app header design

### File Structure
```
app/
├── page.tsx - Main app with all components
├── layout.tsx - Root layout with Farcaster miniapp meta tags
├── api/
│   ├── preview/route.ts - Creature generation from wallet
│   ├── generate-image/route.ts - DALL-E integration
│   ├── deploy/route.ts - Token deployment
│   └── deploy-farcaster/route.ts - Farcaster deployment
├── components/
│   └── FarcasterProvider.tsx - Miniapp SDK integration
public/.well-known/farcaster.json - Miniapp manifest
```

### Environment Variables Needed
```
OPENAI_API_KEY=sk-...
NEYNAR_API_KEY=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### Known Issues / TODOs
1. DALL-E art quality inconsistent - may need fallback to better prompts or different model
2. No real Clanker contract integration yet (simulated deployment)
3. Evolution tracking needs live price data integration
4. Could add more animation polish to creature reveal

### Deployment
- URL: https://frontend-weld-mu-91.vercel.app
- GitHub: https://github.com/resided/clankdex
- Root directory for Vercel: `frontend/`

### Key Components to Know
- `CreatureReveal` - Animation when creature appears
- `LaunchAnimation` - Full-screen overlay during token launch
- `StatsPanel` - Shows creature stats + evolution path
- `RolodexCard` - Card in collection view with live prices

### API Endpoints
- POST `/api/preview` - Generate creature from wallet
- POST `/api/generate-image` - DALL-E image generation
- POST `/api/deploy` - Deploy token

### Last Commit
"docs: technical architecture overview for ClankDex"

---
What should be worked on next? Ask the user!
