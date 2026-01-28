# 🎮 Claudex - Wallet Pokedex × Clanker

A Base L2 miniapp that analyzes your wallet, generates a unique pixel Pokemon-style creature, and launches it as a **Clanker token** with bonding curves!

![Claudex](https://claudex.io/og-image.png)

## ✨ What is Claudex + Clanker?

**Claudex** analyzes your wallet DNA to create a unique Pokemon-style creature. Instead of deploying a basic ERC20, we launch your creature as a **Clanker token** with:

- 🔗 **Instant Bonding Curve** - Trade from day one
- 💰 **70% Creator Rewards** - Earn from trading fees  
- ⚡ **Base L2** - Fast, cheap transactions
- 🎨 **Pixel Art** - Retro Pokemon-style creatures
- 🎮 **12 Element Types** - Fire, Water, Grass, Electric, Ice, Fighting, Poison, Ground, Flying, Psychic, Bug, Dragon

## Architecture

```
claudex/
├── contracts/          
│   └── ClaudexRegistry.sol    # Tracks creatures launched via Clanker
├── backend/            
│   ├── walletAnalyzer.js      # Wallet DNA analysis
│   ├── creatureGenerator.js   # Pixel art generation
│   └── clankerService.js      # Clanker SDK integration
└── frontend/           
    ├── Pokedex UI
    └── Clanker integration
```

## How It Works

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Wallet    │────▶│    DNA       │────▶│   Creature  │
│  Analysis   │     │  Generation  │     │   Stats     │
└─────────────┘     └──────────────┘     └─────────────┘
                                                │
                                                ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Clanker   │◀────│   IPFS       │◀────│  Pixel Art  │
│   Launch    │     │   Upload     │     │  Generation │
└─────────────┘     └──────────────┘     └─────────────┘
       │
       ▼
┌─────────────────────────────────────────────────────┐
│  • Bonding curve token                               │
│  • 70% creator rewards                               │
│  • Listed on clanker.world                          │
│  • Tradeable on Base DEXs                           │
└─────────────────────────────────────────────────────┘
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

**Total Stats** determine initial market cap on Clanker:
- 300-400: 5 ETH market cap
- 400-450: 8 ETH market cap  
- 450+: 10 ETH market cap

## 🔥 Element Types & Rarity

| Element | Rarity | Market Cap Boost |
|---------|--------|------------------|
| Fire, Water, Grass, Fighting, Ground, Bug | Common | - |
| Electric, Poison, Flying | Uncommon | +0.5 ETH |
| Ice, Psychic | Rare | +1 ETH |
| **Dragon** | **Legendary** | **+2 ETH** |

## Clanker Configuration

When deploying via Clanker, each creature token gets:

```javascript
{
  // Token basics
  name: "Sparkmon #a3f2",
  symbol: "FISPA",
  image: "ipfs://...",
  
  // Bonding curve
  pool: {
    quoteToken: WETH,
    initialMarketCap: "5-12 ETH" // Based on rarity
  },
  
  // Vesting (5% to creator, 30 days)
  vault: {
    percentage: 5,
    durationInDays: 30
  },
  
  // Revenue sharing
  rewardsConfig: {
    creatorReward: 70,      // 70% to you
    interfaceReward: 30     // 30% to Claudex
  }
}
```

## API Endpoints

### POST `/api/analyze`
Analyzes wallet and returns creature data

### POST `/api/generate-image`
Generates creature image and uploads to IPFS

### POST `/api/deploy`
Launches creature as Clanker token

```json
{
  "creature": { ... },
  "creatorAddress": "0x...",
  "simulate": false
}
```

Response:
```json
{
  "success": true,
  "tokenAddress": "0x...",
  "config": {
    "symbol": "FISPA",
    "marketCap": "8.5"
  }
}
```

### POST `/api/summon`
Full flow: analyze + generate + deploy

## Smart Contracts

### ClaudexRegistry

Stores creature metadata and links to Clanker tokens:

```solidity
struct Creature {
    address tokenAddress;    // Clanker token
    address creator;
    string name;
    string species;
    uint256 dna;
    uint8[6] stats;          // level, hp, attack, defense, speed, special
    string element;
    string imageURI;
    bool isClanker;          // Always true
}
```

Key functions:
- `registerCreature()` - Links Clanker token to creature data
- `getCreaturesByCreator()` - Get all creatures by wallet
- `getLeaderboardByStat()` - Global rankings

## Environment Variables

### Backend (.env)
```env
NETWORK=sepolia
RPC_URL=https://sepolia.base.org
DEPLOYER_PRIVATE_KEY=0x...
PINATA_JWT=...
CLADEX_ADMIN=0x...
SIMULATE_DEPLOY=false
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
NEXT_PUBLIC_REGISTRY_ADDRESS=0x...
NEXT_PUBLIC_CLANKER_URL=https://clanker.world
```

## Frame Miniapp

Works as a Farcaster Frame:

```json
{
  "frame": {
    "name": "Claudex",
    "buttonTitle": "🎮 Launch Creature",
    "homeUrl": "https://claudex.io",
    "splashBackgroundColor": "#DC0A2D"
  }
}
```

## Deployment Checklist

- [ ] Deploy ClaudexRegistry contract
- [ ] Set up backend with Clanker SDK
- [ ] Configure IPFS (Pinata)
- [ ] Set up frontend with WalletConnect
- [ ] Test on baseSepolia
- [ ] Deploy to base mainnet
- [ ] Verify contracts on Basescan
- [ ] Submit to Clanker directory

## Links

- **Website**: https://claudex.io
- **Clanker**: https://clanker.world
- **BaseScan**: https://basescan.org
- **Farcaster**: @claudex

## License

MIT License

---

Built with ⚡ by the Claudex team using [Clanker SDK](https://github.com/clanker-devco/clanker-sdk)
