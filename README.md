# 🎮 Claudex - Wallet DNA Analyzer × Clanker Launchpad

**Claudex** is a Base L2 miniapp that analyzes your on-chain DNA (wallet history or Farcaster activity) and generates a unique, pixel-art creature. Your creature is then launched as a **tradeable token** via [Clanker](https://clanker.world) with instant bonding curves.

Think of it as a **Pokédex for wallets** — every wallet has a unique creature waiting to be discovered.

![Claudex](https://claudex.io/og-image.png)

## ✨ What It Is

Claudex reads your wallet's transaction history, token holdings, NFT activity, and DeFi interactions to generate a unique "DNA fingerprint." This DNA determines:

- **🎨 Visual Appearance** — Pixel art creature with colors and traits based on your activity
- **📊 Battle Stats** — HP, Attack, Defense, Speed, Special (1-100 each)
- **🧬 Archetype** — One of 10 personality types (Builder, Degen, Oracle, Whale, etc.)
- **💎 Rarity** — Based on wallet age, diversity, and transaction patterns

Your creature is then **minted as a Clanker token** — instantly tradeable with:
- **Instant Liquidity** — Bonding curve from day one
- **Creator Rewards** — Earn from trading fees
- **On-Chain Registry** — Permanently recorded in the ClaudexRegistry contract

## 🏗️ Architecture

```
claudex/
├── contracts/          
│   └── ClaudexRegistry.sol    # On-chain creature registry
├── backend/            
│   ├── walletAnalyzer.js      # Wallet DNA analysis
│   ├── creatureGenerator.js   # Pixel art generation
│   └── clankerService.js      # Clanker SDK integration
└── frontend/           
    ├── Next.js + React        # Pokedex-style UI
    └── Farcaster Frame        # Miniapp support
```

## 🔄 How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Wallet/Farcaster│────▶│   DNA Analysis  │────▶│  Creature Stats │
│    Analysis      │     │   & Scoring     │     │  & Archetype    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                         ┌─────────────────┐           ▼
                         │  Clanker Token  │◀────┌─────────────────┐
                         │    Launch       │     │  Pixel Art Gen  │
                         │  (Bonding Curve)│     │  & IPFS Upload  │
                         └─────────────────┘     └─────────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ On-Chain        │
                         │ Registry        │
                         │ (Permanent)     │
                         └─────────────────┘
```

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone <repo>
cd claudex
chmod +x deploy.sh
./deploy.sh
```

Or manually:

### 2. Deploy Registry Contract

```bash
cd contracts
npm install

# Create .env with your private key
cp .env.example .env
# Edit .env: PRIVATE_KEY=your_key_here

npx hardhat run scripts/deploy-registry.js --network baseSepolia
```

Save the registry address - you'll need it for the frontend.

### 3. Start Backend

```bash
cd backend
npm install

# Create .env
cp .env.example .env
# Edit .env:
#   - DEPLOYER_PRIVATE_KEY (must have ETH for gas)
#   - PINATA_JWT (for IPFS image upload)
#   - NETWORK=sepolia (or mainnet)

npm run dev
```

### 4. Start Frontend

```bash
cd frontend
npm install

# Create .env.local
cp .env.example .env.local
# Edit .env.local:
#   - NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
#   - NEXT_PUBLIC_REGISTRY_ADDRESS (from step 2)

npm run dev
```

Visit `http://localhost:3000` 🎮

## 🎯 Creature Stats

| Stat | Based On | Range |
|------|----------|-------|
| **HP** | Wallet balance/age | 1-100 |
| **Attack** | Transaction frequency | 1-100 |
| **Defense** | Token diversity | 1-100 |
| **Speed** | NFT activity | 1-100 |
| **Special** | Unique interactions | 1-100 |

**Evolution Tiers** (based on market cap):
- 🥚 **Egg** ($0-1K) → 👶 **Baby** ($1K-10K) → ⭐ **Basic** ($10K-50K)
- ✨ **Stage 1** ($50K-100K) → ⚡ **Stage 2** ($100K-500K)
- 🔥 **Mega** ($500K-1M) → 👑 **Legendary** ($1M+)

## 🧬 Archetypes

| Archetype | Description | Visual Trait |
|-----------|-------------|--------------|
| **Builder** | Heavy contract interactions | Blue tones, geometric shapes |
| **Degen** | High-risk trading activity | Red tones, lightning motifs |
| **Oracle** | Governance/Long-term holder | Purple tones, eye symbols |
| **Whale** | Large holdings, few moves | Cyan tones, wave patterns |
| **Connector** | Social/bridge transactions | Green tones, network nodes |
| **Influencer** | Popular/Farcaster active | Yellow tones, star motifs |

## 🔗 Clanker Integration

Each creature launches as a Clanker token with:

```javascript
{
  name: "Creature Name",
  symbol: "CREATURE",
  image: "ipfs://...",
  pool: {
    quoteToken: WETH,
    initialMarketCap: "5-12 ETH" // Based on rarity
  },
  rewardsConfig: {
    creatorReward: 70,      // 70% to creator
    interfaceReward: 30     // 30% to Claudex
  }
}
```

## 📡 API Endpoints

### POST `/api/analyze`
Analyzes wallet or Farcaster and returns creature data

**Body:** `{ "address": "0x..." }` or `{ "farcasterUsername": "..." }`

### POST `/api/generate-image`
Generates creature pixel art and uploads to IPFS

### POST `/api/deploy`
Launches creature as Clanker token

### POST `/api/summon`
Full flow: analyze + generate + deploy

## 📜 Smart Contracts

### ClaudexRegistry

Stores creature metadata on-chain:

```solidity
struct Creature {
    address tokenAddress;    // Clanker token
    address creator;
    string name;
    uint8[6] stats;          // level, hp, attack, defense, speed, special
    string element;
    string archetype;
    string imageURI;
    uint256 createdAt;
}
```

**Key Functions:**
- `registerCreature()` — Links Clanker token to creature data
- `getCreaturesByCreator()` — Get all creatures by wallet
- `getLeaderboardByStat()` — Global rankings

## 🔧 Environment Variables

### Backend (.env)
```env
NETWORK=sepolia
RPC_URL=https://sepolia.base.org
DEPLOYER_PRIVATE_KEY=0x...
PINATA_JWT=...
CLADEX_ADMIN=0x...
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
NEXT_PUBLIC_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_CLANKER_URL=https://clanker.world
```

## 🖼️ Farcaster Frame

Claudex works as a Farcaster miniapp:

```json
{
  "frame": {
    "name": "Claudex",
    "buttonTitle": "🎮 Summon Creature",
    "homeUrl": "https://claudex.io",
    "splashBackgroundColor": "#DC0A2D"
  }
}
```

## ✅ Deployment Checklist

- [ ] Deploy ClaudexRegistry contract
- [ ] Configure backend with Clanker SDK
- [ ] Set up IPFS (Pinata)
- [ ] Configure frontend with WalletConnect
- [ ] Test on Base Sepolia
- [ ] Deploy to Base Mainnet
- [ ] Verify contracts on Basescan
- [ ] Submit to Clanker directory

## 🔗 Links

- **Website**: https://claudex.io
- **Clanker**: https://clanker.world
- **Base**: https://base.org
- **Farcaster**: @claudex

## 📄 License

MIT License

---

Built with ⚡ by the Claudex team using [Clanker SDK](https://github.com/clanker-devco/clanker-sdk)
