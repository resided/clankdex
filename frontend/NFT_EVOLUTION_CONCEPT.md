# ClankDex Evolution NFT System

## Overview
A companion NFT system that evolves alongside Clanker tokens based on market cap milestones. Each Clanker token gets a unique "Soulbound" NFT that visually evolves through 7 tiers.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Clanker Token  │────▶│  Evolution NFT   │────▶│  Dynamic Metadata│
│   (ERC-20)      │     │   (ERC-721)      │     │   (JSON + Art)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                         │
        ▼                        ▼                         ▼
   - Tradeable             - Soulbound              - Updates on-chain
   - Fungible              - Visual evolution       - IPFS hosted
   - Launched via          - 7 evolution stages     - Tier-based art
     Clanker               - Metadata refresh
```

## How It Works

### 1. Minting (Token Launch)
When a user launches a Clanker token via ClankDex:
1. Clanker ERC-20 token is deployed
2. Evolution NFT is minted to the creator (soulbound)
3. Initial metadata shows "Egg" tier art
4. NFT token ID = Clanker token address hash

### 2. Evolution Triggers
The NFT automatically evolves when market cap crosses thresholds:

| Tier | Market Cap | Visual Change | Special Effect |
|------|-----------|---------------|----------------|
| Egg | $0 - $1K | Basic sprite, cracked shell | None |
| Baby | $1K - $10K | Hatched, small and cute | Sparkle particles |
| Basic | $10K - $50K | Full form, simple colors | Glow aura |
| Stage 1 | $50K - $100K | More detail, accessories | Element particles |
| Stage 2 | $100K - $500K | Enhanced features, wings/horns | Animated background |
| Mega | $500K - $1M | Epic form, legendary features | Rainbow aura |
| Legendary | $1M+ | Mythical, max details, animated | Full particle system, gold border |

### 3. Metadata Updates
- Off-chain service monitors market cap via DexScreener API
- When threshold crossed, new art is generated via AI
- Metadata URI is updated (or uses dynamic contract)
- IPFS stores all 7 versions of art pre-generated

## Smart Contract Design

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ClankDexEvolution is ERC721, Ownable {
    
    struct Evolution {
        uint8 currentTier;      // 0-6 (Egg to Legendary)
        uint256 lastEvolveTime;
        uint256 highestMarketCap;
        string baseTokenURI;    // Points to metadata server
    }
    
    mapping(uint256 => Evolution) public evolutions;
    mapping(address => bool) public authorizedMinters;  // ClankDex contracts
    
    // Market cap thresholds (in USD, 6 decimals)
    uint256[] public thresholds = [
        1_000_000,      // Egg: $0-1K
        10_000_000,     // Baby: $1K-10K
        50_000_000,     // Basic: $10K-50K
        100_000_000,    // Stage 1: $50K-100K
        500_000_000,    // Stage 2: $100K-500K
        1_000_000_000,  // Mega: $500K-1M
        type(uint256).max // Legendary: $1M+
    ];
    
    event Evolved(uint256 indexed tokenId, uint8 newTier, uint256 marketCap);
    event Minted(uint256 indexed tokenId, address indexed clankerToken);
    
    // Soulbound - no transfers allowed except mint/burn
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
        // Allow mint (from=0) but block transfers
        require(from == address(0) || to == address(0), "Soulbound: non-transferable");
    }
    
    function mint(address to, address clankerToken) external returns (uint256) {
        require(authorizedMinters[msg.sender], "Unauthorized");
        
        uint256 tokenId = uint256(keccak256(abi.encodePacked(clankerToken)));
        require(!_exists(tokenId), "Already minted");
        
        _safeMint(to, tokenId);
        
        evolutions[tokenId] = Evolution({
            currentTier: 0,
            lastEvolveTime: block.timestamp,
            highestMarketCap: 0,
            baseTokenURI: "https://api.clankdex.io/metadata/"
        });
        
        emit Minted(tokenId, clankerToken);
        return tokenId;
    }
    
    function checkAndEvolve(uint256 tokenId, uint256 currentMarketCap) external {
        require(_exists(tokenId), "Token not found");
        
        Evolution storage evo = evolutions[tokenId];
        require(currentMarketCap > evo.highestMarketCap, "Market cap not higher");
        
        evo.highestMarketCap = currentMarketCap;
        
        // Find new tier
        uint8 newTier = 0;
        for (uint8 i = 0; i < thresholds.length; i++) {
            if (currentMarketCap < thresholds[i]) {
                newTier = i;
                break;
            }
        }
        
        if (newTier > evo.currentTier) {
            evo.currentTier = newTier;
            evo.lastEvolveTime = block.timestamp;
            emit Evolved(tokenId, newTier, currentMarketCap);
        }
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token not found");
        
        Evolution memory evo = evolutions[tokenId];
        
        // Dynamic URI includes tier for metadata service
        return string(abi.encodePacked(
            evo.baseTokenURI,
            tokenId.toString(),
            "/",
            evo.currentTier.toString()
        ));
    }
}
```

## Art Generation Strategy

### Option 1: Pre-generate All Tiers (Recommended)
1. At mint time, AI generates 7 versions of the creature
2. Each version progressively more epic
3. All stored on IPFS with deterministic paths
4. Metadata service simply returns the appropriate tier

**Pros:** Fast evolution, guaranteed art exists, lower gas
**Cons:** Higher upfront compute cost

### Option 2: Generate On-Demand
1. Only generate current tier art
2. When evolution triggers, generate new art
3. Store new art on IPFS
4. Update metadata

**Pros:** Lower upfront cost, can use better models in future
**Cons:** Evolution delay, higher complexity

### Art Style Progression
```
Tier 0 (Egg):      Pixel art, 32x32, cracked egg with glow
Tier 1 (Baby):     Pixel art, 64x64, chibi style, cute
Tier 2 (Basic):    Pixel art, 128x128, full proportions
Tier 3 (Stage 1):  HD pixel art, 256x256, accessories added
Tier 4 (Stage 2):  HD pixel art, 256x256, effects, particles
Tier 5 (Mega):     Detailed illustration, 512x512, epic pose
Tier 6 (Legendary): Full illustration, 1024x1024, animated PNG/SVG
```

## Off-Chain Services

### 1. Evolution Monitor
```javascript
// Checks all tokens every 5 minutes
async function monitorEvolutions() {
  const tokens = await getAllTokens();
  
  for (const token of tokens) {
    const priceData = await fetchDexScreener(token.address);
    const currentMC = priceData.marketCap;
    
    await contract.checkAndEvolve(token.nftId, currentMC);
    
    // If evolved, notify metadata service
    if (hasEvolved(token.nftId)) {
      await metadataService.updateTier(token.nftId, newTier);
    }
  }
}
```

### 2. Metadata Service
```javascript
// Returns metadata with current tier art
app.get('/metadata/:tokenId/:tier', async (req, res) => {
  const { tokenId, tier } = req.params;
  
  const metadata = {
    name: `Clankmon #${tokenId} - Tier ${tier}`,
    description: `Evolution tier ${TIER_NAMES[tier]}`,
    image: `${IPFS_BASE}/${tokenId}/${tier}.png`,
    attributes: [
      { trait_type: 'Tier', value: TIER_NAMES[tier] },
      { trait_type: 'Market Cap', value: getMarketCap(tokenId) },
      { trait_type: 'Evolutions', value: tier }
    ]
  };
  
  res.json(metadata);
});
```

## Frontend Integration

### Display in Rolodex Card
```typescript
// Add to RolodexCard
const { nftData } = useEvolutionNFT(tokenAddress);

// Show evolution badge
{ nftData && (
  <EvolutionBadge tier={nftData.tier} animated={nftData.tier === 6} />
)}

// Show evolution progress bar to next tier
<EvolutionProgress 
  currentMC={priceData.marketCap} 
  nextThreshold={EVOLUTION_THRESHOLDS[nftData.tier + 1]} 
/>
```

### Evolution Animation
When tier changes:
1. Flash effect on card
2. Particle burst
3. Art crossfades to new tier
4. Confetti if Legendary reached
5. "Evolution Complete!" toast

## Revenue Model

1. **Mint Fee:** 0.001 ETH per Evolution NFT (covers art generation + storage)
2. **Evolution Fee:** Optional small fee for on-chain evolution check
3. **Premium Art:** Users can pay extra for higher-res Legendary art

## Security Considerations

1. **Oracle Risk:** Use multiple price sources (DexScreener + CoinGecko)
2. **Metadata Centralization:** Use IPFS + ENS for metadata domain
3. **Art Availability:** Pin all art to multiple IPFS nodes
4. **Evolution Gaming:** Time-delay between evolutions, use time-weighted average MC

## Future Enhancements

1. **Cross-Collection Evolution:** Evolve by collecting multiple tokens
2. **Battle Mode:** Use NFTs in on-chain battles for XP
3. **Breeding:** Combine two NFTs to create offspring with mixed traits
4. **AR Integration:** View evolved creatures in AR
5. **Physical Cards:** NFC cards that scan to show current evolution
