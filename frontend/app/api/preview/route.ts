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
    "Colors match the creature's elemental affinity",
    "Pure white background",
    "No text, no watermarks, no signatures",
    "Front-facing or 3/4 view pose",
    "Digital art style with soft glow effects",
  ],
  
  artStyle: "digital art, original creature design, ethereal digital entity, soft glowing effects, clean illustration, game asset quality",
  
  elementTraits: {
    Fire: "ember particles, warm glowing aura, flame wisps, molten core visible through skin",
    Water: "flowing liquid form, bubble trails, deep ocean hues, bioluminescent spots",
    Grass: "organic growth patterns, pollen dust, photosynthetic glow, root-like tendrils",
    Electric: "energy arcs, ionized air particles, conductivity patterns, plasma trails",
    Ice: "crystalline formations, frost breath, frozen aura, snowflake patterns",
    Fighting: "tense posture, kinetic energy waves, muscular definition, battle-ready stance",
    Poison: "toxic aura, bubbling secretions, warning color patterns, spore clouds",
    Ground: "mineral deposits, tectonic plates, sediment layers, geological formations",
    Flying: "air currents, cloud wisps, gravitational lightness, wind-swept features",
    Psychic: "third eye glow, telekinetic waves, ethereal mist, consciousness ripples",
    Bug: "hive patterns, compound eye shine, chitin glow, swarm consciousness aura",
    Rock: "mineral veins, crystal inclusions, petrified growths, sedimentary layers",
    Ghost: "phasing effect, spirit tether, ectoplasm trails, soul fragments",
    Dragon: "primal markings, ancient runes, power scales, elemental convergence",
    Dark: "shadow tendrils, void pockets, darkness absorption, eclipse aura",
    Steel: "forged plating, gear integrations, metallic sheen, industrial fusion",
    Fairy: "glamour dust, enchantment swirls, magical resonance, wonder essence",
  }
};

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
  elements: string[];
  statBias: {
    hp?: number;
    attack?: number;
    defense?: number;
    speed?: number;
    special?: number;
  };
};

// Archetype definitions with lore
const ARCHETYPES: Record<string, Archetype> = {
  // Social archetypes based on Farcaster activity
  ORACLE: {
    name: 'Oracle',
    description: 'Sees patterns before others. High engagement, thought leadership.',
    prefixes: ['Seer', 'Viz', 'Prophet', 'Augur', 'Sage', 'Myst', 'Seer', 'Farsee', 'Omen', 'Divi'],
    suffixes: ['sight', 'tell', 'gaze', 'mind', 'eye', 'sense', 'know', 'ward', 'loom', 'cast'],
    elements: ['Psychic', 'Fairy', 'Dark'],
    statBias: { special: 30, speed: 10 },
  },
  
  INFLUENCER: {
    name: 'Influencer',
    description: 'Commands attention. High follower count, viral presence.',
    prefixes: ['Star', 'Nova', 'Lum', 'Radi', 'Beacon', 'Flare', 'Glow', 'Bright', 'Shine', 'Spark'],
    suffixes: ['light', 'beam', 'glow', 'burst', 'flash', 'spark', 'drift', 'fall', 'rise', 'call'],
    elements: ['Fire', 'Electric', 'Flying'],
    statBias: { attack: 20, speed: 20 },
  },
  
  CONNECTOR: {
    name: 'Connector',
    description: 'Bridges communities. Balanced following/followers, high interaction.',
    prefixes: ['Link', 'Nex', 'Bridg', 'Weav', 'Tie', 'Bond', 'Join', 'Merge', 'Sync', 'Hub'],
    suffixes: ['web', 'net', 'thread', 'cord', 'knot', 'loop', 'ring', 'chain', 'link', 'tie'],
    elements: ['Grass', 'Bug', 'Steel'],
    statBias: { hp: 20, defense: 20 },
  },
  
  LURKER: {
    name: 'Lurker',
    description: 'Observes from shadows. Low posts, high consumption.',
    prefixes: ['Shade', 'Umbr', 'Gloom', 'Murk', 'Veil', 'Haze', 'Dusk', 'Night', 'Dim', 'Faint'],
    suffixes: ['shade', 'veil', 'cloak', 'mist', 'fog', 'hush', 'quiet', 'still', 'calm', 'rest'],
    elements: ['Dark', 'Ghost', 'Ice'],
    statBias: { defense: 30, special: 10 },
  },
  
  BUILDER: {
    name: 'Builder',
    description: 'Creates without rest. Developer, high technical engagement.',
    prefixes: ['Forge', 'Smith', 'Craft', 'Build', 'Make', 'Shape', 'Form', 'Mold', 'Cast', 'Weld'],
    suffixes: ['work', 'make', 'form', 'cast', 'mold', 'shape', 'build', 'craft', 'forge', 'smith'],
    elements: ['Steel', 'Rock', 'Ground'],
    statBias: { defense: 25, attack: 15 },
  },
  
  DEGEN: {
    name: 'Degen',
    description: 'High risk, high reward. Gambler spirit, volatile activity patterns.',
    prefixes: ['Chaos', 'Rage', 'Fury', 'Wild', 'Mad', 'Frenzy', 'Storm', 'Blitz', 'Flash', 'Burst'],
    suffixes: ['rage', 'fury', 'storm', 'chaos', 'wild', 'mad', 'frenzy', 'rush', 'dash', 'blaze'],
    elements: ['Fire', 'Electric', 'Fighting'],
    statBias: { attack: 40, defense: -10, speed: 20 },
  },
  
  WHALE: {
    name: 'Whale',
    description: 'Massive presence. High value, moves markets.',
    prefixes: ['Levi', 'Titan', 'Giga', 'Mega', 'Ultra', 'Super', 'Hyper', 'Maxi', 'Grand', 'Vast'],
    suffixes: ['thane', 'titan', 'giant', 'mass', 'bulk', 'heft', 'weight', 'depth', 'void', 'abyss'],
    elements: ['Water', 'Dragon', 'Ice'],
    statBias: { hp: 40, attack: 20, speed: -20 },
  },
  
  SAGE: {
    name: 'Sage',
    description: 'Ancient wisdom. Long-time holder, steady presence.',
    prefixes: ['Elder', 'Ancient', 'Old', 'Prime', 'First', 'Origin', 'Root', 'Core', 'Base', 'Fund'],
    suffixes: ['wise', 'sage', 'mind', 'thought', 'soul', 'spirit', 'heart', 'truth', 'law', 'way'],
    elements: ['Psychic', 'Dragon', 'Fairy'],
    statBias: { special: 25, hp: 15, defense: 10 },
  },
  
  NOMAD: {
    name: 'Nomad',
    description: 'Wanders chains. Multi-chain, explorer, never settles.',
    prefixes: ['Drift', 'Roam', 'Wand', 'Migra', 'Travel', 'Journey', 'Quest', 'Seek', 'Find', 'Path'],
    suffixes: ['walk', 'path', 'road', 'way', 'trail', 'trek', 'roam', 'drift', 'flow', 'wind'],
    elements: ['Flying', 'Ground', 'Bug'],
    statBias: { speed: 40, defense: -10 },
  },
  
  GUARDIAN: {
    name: 'Guardian',
    description: 'Protects others. Security focused, helpful community member.',
    prefixes: ['Shield', 'Guard', 'Ward', 'Protect', 'Keep', 'Save', 'Safe', 'Secure', 'Lock', 'Aegis'],
    suffixes: ['shield', 'guard', 'wall', 'ward', 'keep', 'hold', 'safe', 'secure', 'lock', 'bond'],
    elements: ['Steel', 'Rock', 'Ground'],
    statBias: { defense: 40, hp: 20 },
  },
};

const ELEMENTS = [
  'Fire', 'Water', 'Grass', 'Electric', 'Ice', 'Fighting', 'Poison', 'Ground', 
  'Flying', 'Psychic', 'Bug', 'Rock', 'Ghost', 'Dragon', 'Dark', 'Steel', 'Fairy'
];

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
async function fetchWalletData(address: string) {
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
    return data.user || null;
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

// Generate creature from wallet with full lore
async function generateCreatureFromWallet(address: string, neynarData: any | null) {
  const hash = hashString(address);
  
  // Determine archetype
  const archetypeKey = determineArchetype(neynarData, hash);
  const archetype = ARCHETYPES[archetypeKey];
  
  // Generate lore-based name
  const name = generateLoreName(hash, archetypeKey);
  
  // Determine element based on archetype preference + hash
  const preferredElements = archetype.elements;
  const elementIndex = getHashValue(hash, 5, 100) < 70 
    ? getHashValue(hash, 6, preferredElements.length) // 70% chance of preferred element
    : getHashValue(hash, 7, ELEMENTS.length); // 30% chance of random
  const element = preferredElements[elementIndex] || ELEMENTS[getHashValue(hash, 7, ELEMENTS.length)];
  
  // Generate species type
  const speciesTypes: Record<string, string[]> = {
    Fire: ['Ember Entity', 'Flame Manifest', 'Heat Spirit', 'Pyro Form'],
    Water: ['Aqua Being', 'Tide Essence', 'Current Form', 'Deep Entity'],
    Grass: ['Flora Spirit', 'Growth Manifest', 'Nature Entity', 'Bloom Form'],
    Electric: ['Volt Entity', 'Current Being', 'Spark Manifest', 'Charge Form'],
    Ice: ['Frost Entity', 'Cold Manifest', 'Crystal Being', 'Glacial Form'],
    Fighting: ['Combat Entity', 'Force Manifest', 'Battle Form', 'Strive Being'],
    Poison: ['Toxin Entity', 'Venom Form', 'Toxic Manifest', 'Plague Being'],
    Ground: ['Earth Entity', 'Terrain Form', 'Soil Manifest', 'Land Being'],
    Flying: ['Sky Entity', 'Air Manifest', 'Cloud Form', 'Wind Being'],
    Psychic: ['Mind Entity', 'Thought Form', 'Psyche Manifest', 'Mental Being'],
    Bug: ['Swarm Entity', 'Hive Form', 'Insect Manifest', 'Colony Being'],
    Rock: ['Stone Entity', 'Mineral Form', 'Earth Manifest', 'Crag Being'],
    Ghost: ['Spirit Entity', 'Phantom Form', 'Specter Manifest', 'Soul Being'],
    Dragon: ['Wyrm Entity', 'Drake Form', 'Ancient Manifest', 'Primal Being'],
    Dark: ['Shadow Entity', 'Void Form', 'Darkness Manifest', 'Umbral Being'],
    Steel: ['Metal Entity', 'Iron Form', 'Alloy Manifest', 'Forge Being'],
    Fairy: ['Fae Entity', 'Enchant Form', 'Magic Manifest', 'Wonder Being'],
  };
  
  const species = speciesTypes[element][getHashValue(hash, 8, 4)];
  
  // Generate stats with archetype bias
  const baseHp = 50 + getHashValue(hash, 9, 100);
  const baseAttack = 50 + getHashValue(hash, 10, 100);
  const baseDefense = 50 + getHashValue(hash, 11, 100);
  const baseSpeed = 50 + getHashValue(hash, 12, 100);
  const baseSpecial = 50 + getHashValue(hash, 13, 100);
  
  // Apply archetype stat bias
  const hp = Math.min(150, Math.max(20, baseHp + (archetype.statBias.hp || 0)));
  const attack = Math.min(150, Math.max(20, baseAttack + (archetype.statBias.attack || 0)));
  const defense = Math.min(150, Math.max(20, baseDefense + (archetype.statBias.defense || 0)));
  const speed = Math.min(150, Math.max(20, baseSpeed + (archetype.statBias.speed || 0)));
  const special = Math.min(150, Math.max(20, baseSpecial + (archetype.statBias.special || 0)));
  
  // Generate color palette based on element
  const colorPalettes: Record<string, string[]> = {
    Fire: ['#FF5722', '#FF9800', '#FFC107', '#FFEB3B'],
    Water: ['#2196F3', '#03A9F4', '#00BCD4', '#009688'],
    Grass: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107'],
    Electric: ['#FFEB3B', '#FFC107', '#FF9800', '#FF5722'],
    Ice: ['#00BCD4', '#E0F7FA', '#B2EBF2', '#80DEEA'],
    Fighting: ['#795548', '#8D6E63', '#A1887F', '#BCAAA4'],
    Poison: ['#9C27B0', '#AB47BC', '#BA68C8', '#CE93D8'],
    Ground: ['#795548', '#8D6E63', '#A1887F', '#D7CCC8'],
    Flying: ['#87CEEB', '#B0E0E6', '#ADD8E6', '#E0F7FA'],
    Psychic: ['#E91E63', '#F06292', '#F48FB1', '#F8BBD9'],
    Bug: ['#8BC34A', '#AED581', '#C5E1A5', '#DCEDC8'],
    Rock: ['#757575', '#9E9E9E', '#BDBDBD', '#E0E0E0'],
    Ghost: ['#7B1FA2', '#9C27B0', '#AB47BC', '#BA68C8'],
    Dragon: ['#3F51B5', '#5C6BC0', '#7986CB', '#9FA8DA'],
    Dark: ['#424242', '#616161', '#757575', '#9E9E9E'],
    Steel: ['#607D8B', '#78909C', '#90A4AE', '#B0BEC5'],
    Fairy: ['#F48FB1', '#F8BBD9', '#FCE4EC', '#FFF0F5'],
  };
  
  const colorPalette = colorPalettes[element] || colorPalettes.Fire;
  
  // Generate lore description based on archetype
  const loreDescriptions: Record<string, string[]> = {
    ORACLE: [
      `Born from the foresight of ${neynarData?.username || 'an oracle'}. This ${element.toLowerCase()} being sees patterns before they form.`,
      `A ${element.toLowerCase()} manifestation of prescience. It channels the predictive powers of its origin wallet.`,
      `Forged in the fires of foresight. This entity ${name} guards the wisdom of ${neynarData?.username || 'its creator'}.`,
    ],
    INFLUENCER: [
      `Radiates the charisma of ${neynarData?.username || 'a star'}. This ${element.toLowerCase()} entity commands attention effortlessly.`,
      `A ${element.toLowerCase()} being that shines bright like its origin. ${name} amplifies presence wherever it goes.`,
      `Born from viral energy. This ${element.toLowerCase()} form reflects the magnetic pull of ${neynarData?.username || 'its creator'}.`,
    ],
    CONNECTOR: [
      `Weaves connections like ${neynarData?.username || 'a weaver'}. This ${element.toLowerCase()} entity bridges worlds.`,
      `A ${element.toLowerCase()} manifestation of unity. ${name} binds disparate forces together.`,
      `Forged in the fires of community. This being carries the linking essence of ${neynarData?.username || 'its origin'}.`,
    ],
    LURKER: [
      `Watches from shadows like ${neynarData?.username || 'a phantom'}. This ${element.toLowerCase()} entity sees without being seen.`,
      `A ${element.toLowerCase()} being of quiet power. ${name} observes the world from hidden vantage points.`,
      `Born from silent observation. This ${element.toLowerCase()} form reflects the patient gaze of ${neynarData?.username || 'its creator'}.`,
    ],
    BUILDER: [
      `Shaped by the relentless craft of ${neynarData?.username || 'a builder'}. This ${element.toLowerCase()} entity creates without rest.`,
      `A ${element.toLowerCase()} manifestation of creation. ${name} forges reality with determined will.`,
      `Forged in the fires of making. This being embodies the constructive spirit of ${neynarData?.username || 'its origin'}.`,
    ],
    DEGEN: [
      `Wild and unpredictable like ${neynarData?.username || 'a storm'}. This ${element.toLowerCase()} entity thrives on chaos.`,
      `A ${element.toLowerCase()} being of pure volatility. ${name} risks everything for glory.`,
      `Born from calculated madness. This ${element.toLowerCase()} form channels the reckless energy of ${neynarData?.username || 'its creator'}.`,
    ],
    WHALE: [
      `Massive and deep like ${neynarData?.username || 'the ocean'}. This ${element.toLowerCase()} entity moves markets with a thought.`,
      `A ${element.toLowerCase()} manifestation of magnitude. ${name} carries the weight of great power.`,
      `Forged in the depths of abundance. This being represents the vast holdings of ${neynarData?.username || 'its origin'}.`,
    ],
    SAGE: [
      `Ancient and wise like ${neynarData?.username || 'an elder'}. This ${element.toLowerCase()} entity holds timeless knowledge.`,
      `A ${element.toLowerCase()} being of accumulated wisdom. ${name} speaks only truth.`,
      `Born from patient persistence. This ${element.toLowerCase()} form reflects the steady presence of ${neynarData?.username || 'its creator'}.`,
    ],
    NOMAD: [
      `Restless and wandering like ${neynarData?.username || 'the wind'}. This ${element.toLowerCase()} entity never settles.`,
      `A ${element.toLowerCase()} manifestation of journey. ${name} explores all paths.`,
      `Forged in the fires of exploration. This being carries the wandering spirit of ${neynarData?.username || 'its origin'}.`,
    ],
    GUARDIAN: [
      `Steadfast and protective like ${neynarData?.username || 'a shield'}. This ${element.toLowerCase()} entity defends without question.`,
      `A ${element.toLowerCase()} being of absolute protection. ${name} stands as an unbreakable wall.`,
      `Born from the duty of care. This ${element.toLowerCase()} form embodies the protective will of ${neynarData?.username || 'its creator'}.`,
    ],
  };
  
  const descriptions = loreDescriptions[archetypeKey] || loreDescriptions.ORACLE;
  const description = descriptions[getHashValue(hash, 14, descriptions.length)];
  
  // Generate DNA from address
  const dna = BigInt('0x' + hash.slice(0, 16)).toString();
  
  // Build visual traits
  const visualTraits = CREATURE_STYLE_GUIDE.elementTraits[element as keyof typeof CREATURE_STYLE_GUIDE.elementTraits];
  
  return {
    name,
    species,
    dna,
    element,
    level: 1,
    hp,
    attack,
    defense,
    speed,
    special,
    description,
    colorPalette,
    visualTraits,
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
    
    // Generate image
    const imageResponse = await fetch(new URL('/api/generate-image', request.url).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creature, useDalle: true }),
    });
    
    let imageUrl = null;
    let imageBase64 = null;
    if (imageResponse.ok) {
      const imageData = await imageResponse.json();
      imageUrl = imageData.imageUrl;
      imageBase64 = imageData.imageBase64;
    }
    
    return NextResponse.json({
      creature,
      imageUrl,
      imageBase64,
      archetype: creature.archetype,
      archetypeLore: creature.archetypeLore,
      styleGuide: CREATURE_STYLE_GUIDE,
      farcasterData: creature.neynarData || (identifier ? { username: identifier } : null),
    });
  } catch (error) {
    console.error('Preview API error:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate creature' },
      { status: 500 }
    );
  }
}
