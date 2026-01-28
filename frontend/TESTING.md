# ClankDex End-to-End Testing Guide

## Full Test Flow: Launch → Track → Evolve

---

## Phase 1: Pre-Launch Checks (2 minutes)

### 1.1 Verify Supabase Connection

```bash
# Run the test script
node scripts/setup-table.js
```

**Expected:** `✅ Evolutions table already exists!`

### 1.2 Check Environment Variables

```bash
# Verify .env.local exists and has values
cat .env.local | grep SUPABASE
```

**Expected:** 
```
NEXT_PUBLIC_SUPABASE_URL=https://jzesdipwpsccgctneisf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

### 1.3 Start Local Dev Server

```bash
npm run dev
```

Open: http://localhost:3000

---

## Phase 2: Launch Test Token (5 minutes)

### 2.1 Connect Wallet

1. Open app in browser
2. Click **"Connect Wallet"**
3. Select MetaMask/Rainbow
4. Switch to **Base Sepolia** (testnet) or **Base Mainnet**

### 2.2 Scan Wallet

1. Make sure **"Wallet"** tab is selected
2. Click **"SCAN"** button
3. Wait for analysis (~10 seconds)
4. You should see:
   - DNA helix animation
   - "Analyzing DNA..." → "Generating Creature..."
   - Creature reveal with flash + particles
   - Stats panel with evolution path preview

### 2.3 Launch Token

1. Click **"🚀 LAUNCH"** button
2. Wait for:
   - "Generating pixel art..." (40%)
   - "Launching on Clanker..." (90%)
   - Success message with token address

3. **Copy the token address** (you'll need it!)

### 2.4 Verify in Supabase

Go to: https://supabase.com/dashboard/project/jzesdipwpsccgctneisf

Click **"Table Editor"** → **"evolutions"**

You should see a new row with:
- `token_address`: your token
- `current_tier`: 0 (Egg)
- `entry_number`: #001 (or next available)

---

## Phase 3: Check Rolodex (2 minutes)

### 3.1 View Collection

1. In the app, click **"Collection"** tab
2. You should see your new creature card
3. Check for:
   - Entry number badge (e.g., "#001")
   - **Evolution Tier Badge** showing "Egg"
   - Market Cap showing "$0" or loading

### 3.2 Verify Evolution Badge

On the card, look for:
```
┌─────────────────┐
│  #001      [🥚] │  ← Egg badge (top-right)
│                 │
│   [Creature]    │
│                 │
│  MARKET CAP HP  │
│  [████████░░]   │
│  $0        via  │
└─────────────────┘
```

---

## Phase 4: Simulate Evolution (Test Mode)

Since we can't wait for real market cap growth, let's test the evolution logic:

### 4.1 Manual Evolution Test Script

Create `scripts/test-evolution.js`:

```javascript
const SUPABASE_URL = 'https://jzesdipwpsccgctneisf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_m_nHZbHbxlBjeWAWAXXmcQ_BujNDiWt';

const TOKEN_ADDRESS = 'YOUR_TOKEN_ADDRESS_HERE'; // Replace with yours

async function simulateEvolution() {
  console.log('🧪 Testing evolution tracking...\n');

  // Test tiers
  const tiers = [
    { tier: 0, name: 'Egg', mc: 0 },
    { tier: 1, name: 'Baby', mc: 5000 },
    { tier: 2, name: 'Basic', mc: 25000 },
    { tier: 3, name: 'Stage 1', mc: 75000 },
    { tier: 4, name: 'Stage 2', mc: 250000 },
    { tier: 5, name: 'Mega', mc: 750000 },
    { tier: 6, name: 'Legendary', mc: 2000000 },
  ];

  for (const { tier, name, mc } of tiers) {
    console.log(`⬆️  Simulating ${name} tier (MC: $${mc.toLocaleString()})...`);
    
    // Update Supabase record
    const response = await fetch(`${SUPABASE_URL}/rest/v1/evolutions?token_address=eq.${TOKEN_ADDRESS}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        current_tier: tier,
        highest_market_cap: mc,
        tier_history: [
          { tier: 0, tier_name: 'Egg', market_cap: 0, achieved_at: new Date().toISOString() },
          { tier, tier_name: name, market_cap: mc, achieved_at: new Date().toISOString() }
        ],
        updated_at: new Date().toISOString()
      })
    });

    if (response.ok) {
      console.log(`   ✅ Now showing as ${name} tier!\n`);
    } else {
      console.log(`   ❌ Failed: ${await response.text()}\n`);
    }

    // Wait 2 seconds between updates
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('🎉 Evolution simulation complete!');
  console.log('Refresh the Collection tab to see the tier changes.');
}

simulateEvolution().catch(console.error);
```

### 4.2 Run the Test

```bash
# Replace YOUR_TOKEN_ADDRESS_HERE with your actual token address
# Then run:
node scripts/test-evolution.js
```

### 4.3 Watch the Evolution

While the script runs:
1. Keep the Collection tab open
2. Watch the evolution badge change:
   - 🥚 Egg → 🐣 Baby → ⭐ Basic → 🌟 Stage 1 → 💫 Stage 2 → 🔥 Mega → 👑 Legendary

3. Check the card border/aura effects change with each tier

---

## Phase 5: Verify Data Persistence (2 minutes)

### 5.1 Hard Refresh Test

1. While viewing the evolved creature in Collection
2. Press **Cmd+Shift+R** (Mac) or **Ctrl+F5** (Windows)
3. The tier should remain (not reset to Egg)

### 5.2 Check Supabase History

Go to Supabase Table Editor → evolutions

Click on your token's row and verify:
- `current_tier`: 6 (Legendary)
- `tier_history`: Array with all 7 evolution milestones
- `highest_market_cap`: 2000000

### 5.3 New Browser Test

1. Open app in **incognito/private** window
2. Connect same wallet
3. Go to Collection
4. Tier should still be Legendary

---

## Phase 6: Search & Filter Test (2 minutes)

### 6.1 Test Search

1. In Collection, use search bar
2. Try searching:
   - Creature name
   - Element type (Fire, Water, etc.)
   - Entry number (#001)

### 6.2 Test Filters

Click the **Filter** button and try:
- **Sort by:** Highest MC, Newest, Best Stats
- **Evolution Tier:** Legendary only
- **Element:** Your creature's element

### 6.3 Clear Filters

Click **"Clear all"** and verify all entries show again

---

## Phase 7: Price Data Verification (3 minutes)

### 7.1 Real Price Check

If you launched a real token on Clanker:

1. Go to the creature card
2. Wait 30 seconds for price fetch
3. You should see:
   ```
   💰 $0.001234
   📈 +5.67% (24h)
   via dexscreener
   ```

### 7.2 Market Cap HP Bar

Verify the HP bar shows:
- Current market cap value
- Progress to next tier
- Color changes based on tier

### 7.3 Volume Display

If volume > 0, you should see:
```
📊 24h Volume: $1.2K
```

---

## Expected Test Results Summary

| Phase | Test | Expected Result |
|-------|------|-----------------|
| 1 | Table exists | ✅ Evolutions table found |
| 2 | Token launch | ✅ Creature created, Supabase record inserted |
| 3 | Rolodex view | ✅ Card shows with Egg tier |
| 4 | Evolution simulation | ✅ Tier progresses 0→6, visual effects change |
| 5 | Persistence | ✅ Tier survives refresh, new browser |
| 6 | Search/filter | ✅ Filters work, clear all resets |
| 7 | Price data | ✅ Live price displays, MC HP bar updates |

---

## Troubleshooting

### Issue: "Supabase not configured" error

**Fix:** Check `.env.local` has both SUPABASE_URL and SUPABASE_ANON_KEY

### Issue: Evolution not persisting

**Fix:** Check browser console for Supabase errors. Verify RLS policy allows inserts/updates.

### Issue: Price not showing

**Fix:** Token might not have liquidity yet. DexScreener needs ~$1K+ liquidity to track.

---

## Success Criteria 🎉

✅ **LAUNCH** → Token deploys, Supabase record created
✅ **TRACK** → Evolution tier persists across sessions  
✅ **EVOLVE** → Tier upgrades as market cap grows
✅ **SEARCH** → Can find creatures by name/element/tier
✅ **PRICE** → Live price and MC displayed

**All tests passed? Your ClankDex evolution system is fully operational!** 🚀
