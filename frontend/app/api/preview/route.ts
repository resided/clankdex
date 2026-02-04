import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ============================================
// CREATURE STYLE GUIDE - Original Design
// ============================================
const CREATURE_STYLE_GUIDE = {
  visualRules: [
    "Original creature design, not based on any existing IP",
    "Cute but mysterious digital entity appearance",
    "Glowing eyes that reflect its essence",
    "Proportional body parts with ethereal qualities",
    "Smooth, clean lines with subtle particle effects",
    "Unique color palette based on wallet identity",
    "Pure white background",
    "No text, no watermarks, no signatures",
    "Front-facing or 3/4 view pose",
    "Digital art style with soft glow effects",
  ],

  artStyle: "digital art, original creature design, ethereal digital entity, soft glowing effects, clean illustration, game asset quality",
};

// ============================================
// NEYNAR CACHE (to prevent rate limiting)
// ============================================
const neynarCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCachedNeynarData(address: string): any | null {
  const cached = neynarCache.get(address.toLowerCase());
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedNeynarData(address: string, data: any) {
  neynarCache.set(address.toLowerCase(), { data, timestamp: Date.now() });
}

// ============================================
// WALLET ARCHETYPE SYSTEM
// Based on Neynar social data + on-chain patterns
// ============================================

// Archetype type definition
type Archetype = {
  name: string;
  description: string;
  prefixes: string[];
  suffixes: string[];
};

// Archetype definitions with lore
const ARCHETYPES: Record<string, Archetype> = {
  // Social archetypes based on Farcaster activity
  ORACLE: {
    name: 'Oracle',
    description: 'Sees patterns before others. High engagement, thought leadership.',
    prefixes: ['Seer', 'Viz', 'Prophet', 'Augur', 'Sage', 'Myst', 'Seer', 'Farsee', 'Omen', 'Divi'],
    suffixes: ['sight', 'tell', 'gaze', 'mind', 'eye', 'sense', 'know', 'ward', 'loom', 'cast'],
  },

  INFLUENCER: {
    name: 'Influencer',
    description: 'Commands attention. High follower count, viral presence.',
    prefixes: ['Star', 'Nova', 'Lum', 'Radi', 'Beacon', 'Flare', 'Glow', 'Bright', 'Shine', 'Spark'],
    suffixes: ['light', 'beam', 'glow', 'burst', 'flash', 'spark', 'drift', 'fall', 'rise', 'call'],
  },

  CONNECTOR: {
    name: 'Connector',
    description: 'Bridges communities. Balanced following/followers, high interaction.',
    prefixes: ['Link', 'Nex', 'Bridg', 'Weav', 'Tie', 'Bond', 'Join', 'Merge', 'Sync', 'Hub'],
    suffixes: ['web', 'net', 'thread', 'cord', 'knot', 'loop', 'ring', 'chain', 'link', 'tie'],
  },

  LURKER: {
    name: 'Lurker',
    description: 'Observes from shadows. Low posts, high consumption.',
    prefixes: ['Shade', 'Umbr', 'Gloom', 'Murk', 'Veil', 'Haze', 'Dusk', 'Night', 'Dim', 'Faint'],
    suffixes: ['shade', 'veil', 'cloak', 'mist', 'fog', 'hush', 'quiet', 'still', 'calm', 'rest'],
  },

  BUILDER: {
    name: 'Builder',
    description: 'Creates without rest. Developer, high technical engagement.',
    prefixes: ['Forge', 'Smith', 'Craft', 'Build', 'Make', 'Shape', 'Form', 'Mold', 'Cast', 'Weld'],
    suffixes: ['work', 'make', 'form', 'cast', 'mold', 'shape', 'build', 'craft', 'forge', 'smith'],
  },

  DEGEN: {
    name: 'Degen',
    description: 'High risk, high reward. Gambler spirit, volatile activity patterns.',
    prefixes: ['Chaos', 'Rage', 'Fury', 'Wild', 'Mad', 'Frenzy', 'Storm', 'Blitz', 'Flash', 'Burst'],
    suffixes: ['rage', 'fury', 'storm', 'chaos', 'wild', 'mad', 'frenzy', 'rush', 'dash', 'blaze'],
  },

  WHALE: {
    name: 'Whale',
    description: 'Massive presence. High value, moves markets.',
    prefixes: ['Levi', 'Titan', 'Giga', 'Mega', 'Ultra', 'Super', 'Hyper', 'Maxi', 'Grand', 'Vast'],
    suffixes: ['thane', 'titan', 'giant', 'mass', 'bulk', 'heft', 'weight', 'depth', 'void', 'abyss'],
  },

  SAGE: {
    name: 'Sage',
    description: 'Ancient wisdom. Long-time holder, steady presence.',
    prefixes: ['Elder', 'Ancient', 'Old', 'Prime', 'First', 'Origin', 'Root', 'Core', 'Base', 'Fund'],
    suffixes: ['wise', 'sage', 'mind', 'thought', 'soul', 'spirit', 'heart', 'truth', 'law', 'way'],
  },

  NOMAD: {
    name: 'Nomad',
    description: 'Wanders chains. Multi-chain, explorer, never settles.',
    prefixes: ['Drift', 'Roam', 'Wand', 'Migra', 'Travel', 'Journey', 'Quest', 'Seek', 'Find', 'Path'],
    suffixes: ['walk', 'path', 'road', 'way', 'trail', 'trek', 'roam', 'drift', 'flow', 'wind'],
  },

  GUARDIAN: {
    name: 'Guardian',
    description: 'Protects others. Security focused, helpful community member.',
    prefixes: ['Shield', 'Guard', 'Ward', 'Protect', 'Keep', 'Save', 'Safe', 'Secure', 'Lock', 'Aegis'],
    suffixes: ['shield', 'guard', 'wall', 'ward', 'keep', 'hold', 'safe', 'secure', 'lock', 'bond'],
  },
};

// Hash function for deterministic generation
function hashString(str: string): string {
  return crypto.createHash('sha256').update(str.toLowerCase()).digest('hex');
}

// Get random number from hash at position
function getHashValue(hash: string, position: number, max: number): number {
  const segment = hash.slice(position * 2, position * 2 + 4);
  return parseInt(segment, 16) % max;
}

// Fetch wallet data from Neynar
// RE-ENABLED with caching to prevent rate limiting
async function fetchWalletData(address: string) {
  // Check cache first
  const cached = getCachedNeynarData(address);
  if (cached) {
    console.log('Using cached Neynar data for:', address.slice(0, 10));
    return cached;
  }
  
  try {
    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) {
      console.log('Neynar API key not configured');
      return null;
    }
    
    const response = await fetch(`https://api.neynar.com/v2/farcaster/user/custody-address?custody_address=${address}`, {
      headers: {
        'accept': 'application/json',
        'api_key': apiKey,
      },
    });
    
    if (!response.ok) {
      console.log('Neynar fetch failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    const userData = data.user || null;
    
    // Cache the result for 1 hour to prevent rate limiting
    if (userData) {
      setCachedNeynarData(address, userData);
    }
    
    return userData;
  } catch (error) {
    console.error('Neynar API error:', error);
    return null;
  }
}

// Determine archetype from Neynar data
function determineArchetype(neynarData: any, hash: string): keyof typeof ARCHETYPES {
  if (!neynarData) {
    // Default to hash-based if no Neynar data
    const archetypeKeys = Object.keys(ARCHETYPES) as (keyof typeof ARCHETYPES)[];
    return archetypeKeys[getHashValue(hash, 0, archetypeKeys.length)];
  }
  
  const followers = neynarData.follower_count || 0;
  const following = neynarData.following_count || 0;
  const engagement = followers + following;
  
  // Calculate follower ratio for archetype detection
  const ratio = following > 0 ? followers / following : followers;
  
  // Determine archetype based on patterns
  if (followers > 10000) return 'INFLUENCER';
  if (followers > 5000 && ratio > 2) return 'ORACLE';
  if (ratio > 0.8 && ratio < 1.5 && engagement > 1000) return 'CONNECTOR';
  if (followers < 100 && following > 500) return 'LURKER';
  if (neynarData.username?.includes('dev') || neynarData.bio?.includes('build')) return 'BUILDER';
  if (neynarData.username?.includes('degen') || neynarData.bio?.includes('ape')) return 'DEGEN';
  if (followers > 5000 && following < 100) return 'WHALE';
  if (neynarData.active_on_fc_since && Date.now() - new Date(neynarData.active_on_fc_since).getTime() > 2 * 365 * 24 * 60 * 60 * 1000) return 'SAGE';
  if (following > followers * 2) return 'NOMAD';
  if (neynarData.username?.includes('guard') || neynarData.bio?.includes('security')) return 'GUARDIAN';
  
  // Hash-based fallback
  const archetypeKeys = Object.keys(ARCHETYPES) as (keyof typeof ARCHETYPES)[];
  return archetypeKeys[getHashValue(hash, 0, archetypeKeys.length)];
}

// Generate lore-based name from archetype
function generateLoreName(hash: string, archetype: keyof typeof ARCHETYPES): string {
  const archetypeData = ARCHETYPES[archetype];
  
  const prefix = archetypeData.prefixes[getHashValue(hash, 1, archetypeData.prefixes.length)];
  const suffix = archetypeData.suffixes[getHashValue(hash, 2, archetypeData.suffixes.length)];
  
  // Sometimes add a middle syllable for longer names
  if (getHashValue(hash, 3, 100) < 30) {
    const middle = archetypeData.prefixes[getHashValue(hash, 4, archetypeData.prefixes.length)].slice(0, 3);
    return `${prefix}${middle.toLowerCase()}${suffix}`;
  }
  
  return `${prefix}${suffix}`;
}

// Generate creature from wallet with archetype-based identity
async function generateCreatureFromWallet(address: string, neynarData: any | null) {
  const hash = hashString(address);

  // Determine archetype
  const archetypeKey = determineArchetype(neynarData, hash);
  const archetype = ARCHETYPES[archetypeKey];

  // Generate lore-based name
  const name = generateLoreName(hash, archetypeKey);

  // Generate color palette from hash (unique per wallet)
  const hue1 = getHashValue(hash, 5, 360);
  const hue2 = (hue1 + 30 + getHashValue(hash, 6, 60)) % 360;
  const colorPalette = [
    `hsl(${hue1}, 70%, 50%)`,
    `hsl(${hue1}, 60%, 60%)`,
    `hsl(${hue2}, 70%, 50%)`,
    `hsl(${hue2}, 60%, 60%)`,
  ];

  // Generate description based on archetype
  const descriptions: Record<string, string> = {
    ORACLE: `${name} emerged from the blockchain with the gift of foresight. Its presence speaks of patterns seen before others.`,
    INFLUENCER: `${name} burst onto the chain with undeniable magnetism. It commands attention wherever it goes.`,
    CONNECTOR: `${name} formed from the web of connections that bind the network. It bridges communities effortlessly.`,
    LURKER: `${name} manifested in the shadows, watching and waiting. It observes more than it speaks.`,
    BUILDER: `${name} was forged through countless hours of creation. It shapes the digital world with purpose.`,
    DEGEN: `${name} exploded into existence through sheer force of will. High risk, high reward is its way.`,
    WHALE: `${name} rose from the depths with immense power. Its presence alone shifts the tides.`,
    SAGE: `${name} awakened after ages of silent observation. Ancient wisdom flows through it.`,
    NOMAD: `${name} wandered in from beyond the known chains. It carries stories from distant networks.`,
    GUARDIAN: `${name} materialized as a protector of the realm. It stands vigilant, always ready.`,
  };

  const description = descriptions[archetypeKey] || `${name} emerged from the digital ether, unique and mysterious.`;

  // Generate DNA from address
  const dna = BigInt('0x' + hash.slice(0, 16)).toString();

  return {
    name,
    dna,
    description,
    colorPalette,
    archetype: archetypeKey,
    archetypeLore: archetype.description,
    neynarData: neynarData ? {
      username: neynarData.username,
      displayName: neynarData.display_name,
      followerCount: neynarData.follower_count,
      followingCount: neynarData.following_count,
    } : null,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, identifier } = body;
    
    // Use address for wallet mode, identifier for Farcaster mode
    const seed = address || identifier;
    
    if (!seed) {
      return NextResponse.json(
        { error: 'Missing address or identifier' },
        { status: 400 }
      );
    }
    
    // Fetch Neynar data if we have an address
    let neynarData = null;
    if (address) {
      neynarData = await fetchWalletData(address);
    }
    
    // Generate creature with full lore
    const creature = await generateCreatureFromWallet(seed, neynarData);

    // Extract PFP URL from Neynar data for image transformation
    const pfpUrl = neynarData?.pfp_url || null;

    // Generate image (with PFP transformation if available)
    const imageResponse = await fetch(new URL('/api/generate-image', request.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creature, useAI: true, pfpUrl }),
    });

    let imageUrl = null;
    let imageBase64 = null;
    let usedPFP = false;
    if (imageResponse.ok) {
      const imageData = await imageResponse.json();
      imageUrl = imageData.imageUrl;
      imageBase64 = imageData.imageBase64;
      usedPFP = imageData.usedPFP || false;
    }
    
    return NextResponse.json({
      creature,
      imageUrl,
      imageBase64,
      archetype: creature.archetype,
      archetypeLore: creature.archetypeLore,
      styleGuide: CREATURE_STYLE_GUIDE,
      farcasterData: creature.neynarData || (identifier ? { username: identifier } : null),
      pfpUrl,
      usedPFP,
    });
  } catch (error) {
    console.error('Preview API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate creature' },
      { status: 500 }
    );
  }
}
